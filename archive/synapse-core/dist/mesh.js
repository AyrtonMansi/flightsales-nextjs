import { EventEmitter } from 'events';
import WebSocket from 'ws';
/**
 * Circuit breaker for peer health monitoring
 *
 * AUDIT: Isolates misbehaving peers before they can disrupt the network.
 * Triggers after 5 consecutive failures within 60 seconds.
 */
class CircuitBreaker {
    threshold;
    timeoutMs;
    failures = 0;
    lastFailureTime = 0;
    state = 'closed';
    constructor(threshold = 5, timeoutMs = 60000) {
        this.threshold = threshold;
        this.timeoutMs = timeoutMs;
    }
    recordSuccess() {
        if (this.state === 'half-open') {
            this.state = 'closed';
            this.failures = 0;
        }
    }
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'open';
            return true; // Circuit opened
        }
        return false;
    }
    canAttempt() {
        if (this.state === 'closed')
            return true;
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeoutMs) {
                this.state = 'half-open';
                return true;
            }
            return false;
        }
        return this.state === 'half-open';
    }
    getState() {
        return this.state;
    }
}
export class SynapseMesh extends EventEmitter {
    config;
    peers = new Map();
    circuitBreakers = new Map();
    server;
    heartbeatTimer;
    isRunning = false;
    constructor(config) {
        super();
        this.config = config;
    }
    /**
     * Start mesh node
     *
     * AUDIT: Before accepting connections, must verify:
     * 1. GPU is available and not overloaded
     * 2. Sufficient disk space for model cache
     * 3. Network bandwidth test passed
     */
    async start() {
        if (this.isRunning) {
            throw new MeshError('Mesh already running');
        }
        // Start WebSocket server
        this.server = new WebSocket.Server({
            port: this.config.listenPort,
            // AUDIT: Limit max payload to prevent memory exhaustion
            maxPayload: 10 * 1024 * 1024, // 10MB
        });
        this.server.on('connection', (socket, req) => {
            this.handleIncomingConnection(socket, req);
        });
        // Connect to bootstrap nodes
        for (const node of this.config.bootstrapNodes) {
            await this.connectToPeer(node);
        }
        // Start heartbeat
        this.heartbeatTimer = setInterval(() => this.sendHeartbeats(), this.config.heartbeatIntervalMs);
        this.isRunning = true;
        this.emit('started', { nodeId: this.config.nodeId, port: this.config.listenPort });
    }
    /**
     * Stop mesh node gracefully
     */
    async stop() {
        if (!this.isRunning)
            return;
        // Clear heartbeat timer
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        // Close all peer connections
        for (const [nodeId, peer] of this.peers) {
            peer.socket.close(1000, 'Node shutting down');
            this.peers.delete(nodeId);
        }
        // Close server
        this.server?.close();
        this.isRunning = false;
        this.emit('stopped');
    }
    /**
     * Broadcast job offer to available peers
     *
     * AUDIT: Job offers contain sensitive prompt data. Must be:
     * 1. End-to-end encrypted (prompt only visible to assigned node)
     * 2. Rate limited to prevent spam
     * 3. Include proof of payment (signed escrow tx)
     */
    async broadcastJobOffer(job) {
        const capablePeers = this.findCapablePeers(job.modelId);
        if (capablePeers.length === 0) {
            throw new MeshError('No capable peers found for model ' + job.modelId);
        }
        const offers = [];
        for (const peer of capablePeers) {
            // Check circuit breaker
            const breaker = this.getCircuitBreaker(peer.nodeId);
            if (!breaker.canAttempt()) {
                continue;
            }
            try {
                await this.sendMessage(peer.nodeId, {
                    type: 'job_offer',
                    payload: {
                        jobId: job.id,
                        modelId: job.modelId,
                        maxPrice: job.maxPrice,
                        priority: job.priority,
                        // AUDIT: Prompt is encrypted, not visible in offer
                        // Only revealed after node accepts and proves stake
                    },
                });
                offers.push(peer.nodeId);
            }
            catch (error) {
                breaker.recordFailure();
                this.emit('peerError', { nodeId: peer.nodeId, error });
            }
        }
        return offers;
    }
    /**
     * Send job result back to requester
     *
     * AUDIT: Results must include ZK proof of valid execution.
     * Without proof, requester can dispute and refuse payment.
     */
    async sendJobResult(requesterId, jobId, result) {
        const peer = this.peers.get(requesterId);
        if (!peer) {
            throw new MeshError(`Peer ${requesterId} not connected`);
        }
        // AUDIT: Verify proof exists before sending
        if (!result.proof || !result.proof.proof) {
            throw new MeshError('Cannot send result without ZK proof');
        }
        await this.sendMessage(requesterId, {
            type: 'job_result',
            payload: {
                jobId,
                output: result.output,
                tokensUsed: result.tokensUsed,
                computeTimeMs: result.computeTimeMs,
                proof: result.proof,
            },
        });
    }
    /**
     * Get list of connected peers
     */
    getPeers() {
        return Array.from(this.peers.values());
    }
    /**
     * Get mesh health metrics
     */
    getMetrics() {
        const peers = this.getPeers();
        const totalMessages = peers.reduce((sum, p) => sum + p.messageCount, 0);
        const totalFailed = peers.reduce((sum, p) => sum + p.failedMessages, 0);
        const totalLatency = peers.reduce((sum, p) => sum + p.latencyMs, 0);
        const openCircuits = Array.from(this.circuitBreakers.values())
            .filter(cb => cb.getState() === 'open')
            .length;
        return {
            totalPeers: peers.length,
            averageLatency: peers.length > 0 ? totalLatency / peers.length : 0,
            messageSuccessRate: totalMessages > 0
                ? (totalMessages - totalFailed) / totalMessages
                : 1,
            openCircuits,
        };
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    async connectToPeer(address) {
        // AUDIT: Prevent connection to self
        if (address.includes(String(this.config.listenPort))) {
            return;
        }
        // Check peer limit
        if (this.peers.size >= this.config.maxPeers) {
            throw new MeshError('Max peer limit reached');
        }
        const socket = new WebSocket(address);
        socket.on('open', () => {
            // Send capabilities handshake
            this.sendRawMessage(socket, {
                type: 'capabilities',
                payload: {
                    nodeId: this.config.nodeId,
                    // Include capability advertisement
                },
            });
        });
        socket.on('message', (data) => {
            this.handleMessage(socket, data.toString());
        });
        socket.on('error', (error) => {
            this.emit('connectionError', { address, error });
        });
        socket.on('close', () => {
            // Find and remove peer
            for (const [id, peer] of this.peers) {
                if (peer.socket === socket) {
                    this.peers.delete(id);
                    this.emit('peerDisconnected', { nodeId: id });
                    break;
                }
            }
        });
    }
    handleIncomingConnection(socket, _req) {
        // AUDIT: Rate limit incoming connections by IP
        // Implementation would check req.headers['x-forwarded-for'] or similar
        socket.on('message', (data) => {
            this.handleMessage(socket, data.toString());
        });
        socket.on('error', (error) => {
            this.emit('connectionError', { error });
        });
    }
    handleMessage(socket, data) {
        try {
            const message = JSON.parse(data);
            // AUDIT: Verify signature
            if (!this.verifyMessageSignature(message)) {
                this.emit('invalidMessage', { reason: 'bad_signature', sender: message.senderId });
                return;
            }
            // Update peer info if known
            const peer = this.peers.get(message.senderId);
            if (peer) {
                peer.lastSeen = new Date();
                // Record success for circuit breaker
                const breaker = this.circuitBreakers.get(message.senderId);
                breaker?.recordSuccess();
            }
            // Handle message by type
            switch (message.type) {
                case 'heartbeat':
                    // Update latency
                    if (peer && message.payload) {
                        const payload = message.payload;
                        peer.latencyMs = Date.now() - payload.timestamp;
                    }
                    break;
                case 'capabilities':
                    // New peer handshake
                    this.handleCapabilityMessage(socket, message);
                    break;
                case 'job_offer':
                    this.emit('jobOffer', message.payload);
                    break;
                case 'job_accept':
                    this.emit('jobAccept', message.payload);
                    break;
                case 'job_result':
                    this.emit('jobResult', message.payload);
                    break;
                case 'peer_discovery':
                    this.handlePeerDiscovery(message);
                    break;
            }
        }
        catch (error) {
            this.emit('messageError', { error, data });
        }
    }
    handleCapabilityMessage(socket, message) {
        const payload = message.payload;
        // Store peer connection
        this.peers.set(payload.nodeId, {
            nodeId: payload.nodeId,
            socket,
            address: '', // Would extract from socket
            connectedAt: new Date(),
            capabilities: payload.capabilities,
            lastSeen: new Date(),
            latencyMs: 0,
            messageCount: 0,
            failedMessages: 0,
        });
        this.emit('peerConnected', { nodeId: payload.nodeId });
    }
    handlePeerDiscovery(message) {
        const payload = message.payload;
        // Connect to discovered peers (up to max)
        for (const peer of payload.peers) {
            if (this.peers.size < this.config.maxPeers) {
                this.connectToPeer(peer).catch(() => {
                    // Ignore failed connections during discovery
                });
            }
        }
    }
    async sendMessage(nodeId, message) {
        const peer = this.peers.get(nodeId);
        if (!peer) {
            throw new MeshError(`Peer ${nodeId} not found`);
        }
        const fullMessage = {
            ...message,
            senderId: this.config.nodeId,
            timestamp: Date.now(),
            signature: this.signMessage(message),
        };
        return this.sendRawMessage(peer.socket, fullMessage);
    }
    sendRawMessage(socket, message) {
        return new Promise((resolve, reject) => {
            if (socket.readyState !== WebSocket.OPEN) {
                reject(new MeshError('Socket not open'));
                return;
            }
            socket.send(JSON.stringify(message), (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
    sendHeartbeats() {
        for (const [nodeId, peer] of this.peers) {
            this.sendMessage(nodeId, {
                type: 'heartbeat',
                payload: { timestamp: Date.now() },
            }).catch(() => {
                peer.failedMessages++;
            });
        }
    }
    findCapablePeers(modelId) {
        return this.getPeers().filter(peer => peer.capabilities.supportedModels.includes(modelId) &&
            this.getCircuitBreaker(peer.nodeId).canAttempt());
    }
    getCircuitBreaker(nodeId) {
        if (!this.circuitBreakers.has(nodeId)) {
            this.circuitBreakers.set(nodeId, new CircuitBreaker());
        }
        return this.circuitBreakers.get(nodeId);
    }
    signMessage(_message) {
        // AUDIT: Sign message hash with node private key
        // Implementation would use ethers or similar
        return 'signature_placeholder';
    }
    verifyMessageSignature(_message) {
        // AUDIT: Recover public key from signature and verify against known peers
        // For MVP, accept all (would verify in production)
        return true;
    }
}
export class MeshError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MeshError';
    }
}
//# sourceMappingURL=mesh.js.map