import { EventEmitter } from 'events';
import WebSocket from 'ws';
import type { NodeInfo, InferenceJob, JobResult } from './types.js';
/**
 * Mesh Networking Layer
 *
 * AUDIT: This handles P2P communication between nodes. Security critical:
 * 1. All messages must be signed to prevent spoofing
 * 2. Encryption required for job data (prompts are sensitive)
 * 3. Rate limiting prevents DoS on individual nodes
 * 4. Circuit breakers isolate malicious peers
 */
interface MeshConfig {
    readonly nodeId: string;
    readonly privateKey: string;
    readonly listenPort: number;
    readonly bootstrapNodes: string[];
    readonly maxPeers: number;
    readonly heartbeatIntervalMs: number;
    readonly messageTimeoutMs: number;
}
interface PeerConnection {
    readonly nodeId: string;
    readonly socket: WebSocket;
    readonly address: string;
    readonly connectedAt: Date;
    readonly capabilities: NodeInfo['capabilities'];
    lastSeen: Date;
    latencyMs: number;
    messageCount: number;
    failedMessages: number;
}
export declare class SynapseMesh extends EventEmitter {
    private readonly config;
    private readonly peers;
    private readonly circuitBreakers;
    private server?;
    private heartbeatTimer?;
    private isRunning;
    constructor(config: MeshConfig);
    /**
     * Start mesh node
     *
     * AUDIT: Before accepting connections, must verify:
     * 1. GPU is available and not overloaded
     * 2. Sufficient disk space for model cache
     * 3. Network bandwidth test passed
     */
    start(): Promise<void>;
    /**
     * Stop mesh node gracefully
     */
    stop(): Promise<void>;
    /**
     * Broadcast job offer to available peers
     *
     * AUDIT: Job offers contain sensitive prompt data. Must be:
     * 1. End-to-end encrypted (prompt only visible to assigned node)
     * 2. Rate limited to prevent spam
     * 3. Include proof of payment (signed escrow tx)
     */
    broadcastJobOffer(job: InferenceJob): Promise<string[]>;
    /**
     * Send job result back to requester
     *
     * AUDIT: Results must include ZK proof of valid execution.
     * Without proof, requester can dispute and refuse payment.
     */
    sendJobResult(requesterId: string, jobId: string, result: JobResult): Promise<void>;
    /**
     * Get list of connected peers
     */
    getPeers(): PeerConnection[];
    /**
     * Get mesh health metrics
     */
    getMetrics(): {
        totalPeers: number;
        averageLatency: number;
        messageSuccessRate: number;
        openCircuits: number;
    };
    private connectToPeer;
    private handleIncomingConnection;
    private handleMessage;
    private handleCapabilityMessage;
    private handlePeerDiscovery;
    private sendMessage;
    private sendRawMessage;
    private sendHeartbeats;
    private findCapablePeers;
    private getCircuitBreaker;
    private signMessage;
    private verifyMessageSignature;
}
export declare class MeshError extends Error {
    constructor(message: string);
}
export {};
//# sourceMappingURL=mesh.d.ts.map