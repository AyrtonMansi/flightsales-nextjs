import { z } from 'zod';
/**
 * Core type definitions for Synapse Network
 *
 * AUDIT: All external inputs must pass through these schemas before processing.
 * This prevents runtime type errors and malicious input injection.
 */
/**
 * HSK Token amount validation
 * - Must be positive
 * - Max 18 decimal places (ERC-20 standard)
 * - String representation to avoid floating point errors
 */
export declare const TokenAmountSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Ethereum address validation
 * - Must be 0x prefix + 40 hex characters
 * - Case-insensitive (will normalize to checksum)
 */
export declare const AddressSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Node ID validation
 * - UUID v4 format for global uniqueness
 * - Prevents collision attacks
 */
export declare const NodeIdSchema: z.ZodString;
/**
 * Model identifier validation
 * - Alphanumeric + hyphens/underscores
 * - Max 64 chars to prevent DB bloat
 */
export declare const ModelIdSchema: z.ZodString;
/**
 * Node capabilities and status
 *
 * AUDIT: Node registration must verify GPU specs to prevent fake capacity claims.
 * ZK proofs should verify actual compute power, not just self-reported specs.
 */
export interface NodeInfo {
    readonly id: string;
    readonly address: string;
    readonly endpoint: string;
    readonly capabilities: NodeCapabilities;
    readonly status: NodeStatus;
    readonly reputation: ReputationScore;
    readonly registeredAt: Date;
    readonly lastSeen: Date;
}
export interface NodeCapabilities {
    readonly gpuModel: string;
    readonly vramGB: number;
    readonly supportedModels: string[];
    readonly maxConcurrentJobs: number;
    readonly region: string;
}
export type NodeStatus = 'online' | 'busy' | 'offline' | 'suspended';
/**
 * Reputation system prevents Sybil attacks and ensures quality
 *
 * AUDIT: Reputation must decay over time to prevent "sleeping giants" from
 * dominating the network. Recent performance matters more than historical.
 */
export interface ReputationScore {
    readonly totalJobs: number;
    readonly successfulJobs: number;
    readonly failedJobs: number;
    readonly averageLatencyMs: number;
    readonly score: number;
    readonly lastUpdated: Date;
}
/**
 * Inference job structure
 *
 * AUDIT: All jobs must include ZK-proof requirements to prevent:
 * 1. Nodes claiming payment without doing work
 * 2. Users disputing valid results
 * 3. Man-in-the-middle result tampering
 */
export interface InferenceJob {
    readonly id: string;
    readonly modelId: string;
    readonly prompt: string;
    readonly maxTokens: number;
    readonly temperature: number;
    readonly userAddress: string;
    readonly maxPrice: string;
    readonly priority: JobPriority;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    readonly status: JobStatus;
    readonly result?: JobResult;
}
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';
export type JobStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'disputed';
export interface JobResult {
    readonly output: string;
    readonly tokensUsed: number;
    readonly computeTimeMs: number;
    readonly nodeId: string;
    readonly completedAt: Date;
    readonly proof: ZKProof;
}
/**
 * Zero-knowledge proof structure
 *
 * AUDIT: Proof verification is the security critical path. Any vulnerability
 * here allows nodes to steal funds without doing work.
 */
export interface ZKProof {
    readonly proof: string;
    readonly publicInputs: string[];
    readonly verifierContract: string;
}
/**
 * Payment structure for job settlement
 *
 * AUDIT: All payment calculations must be deterministic and verifiable on-chain.
 * Floating point math is forbidden - use only integer arithmetic with 18 decimals.
 */
export interface Payment {
    readonly jobId: string;
    readonly payer: string;
    readonly payee: string;
    readonly amount: string;
    readonly platformFee: string;
    readonly timestamp: Date;
    readonly txHash?: string;
}
/**
 * Escrow state for pending jobs
 *
 * AUDIT: Escrow release conditions must be precisely defined:
 * - Success: Release to node after proof verification
 * - Failure: Return to user after timeout
 * - Dispute: Lock until arbitration completes
 */
export interface EscrowState {
    readonly jobId: string;
    readonly amount: string;
    readonly status: 'locked' | 'released' | 'refunded';
    readonly lockExpiry: Date;
}
/**
 * Standard API response wrapper
 *
 * AUDIT: All API responses must use this structure for consistency.
 * Never return raw data without error handling envelope.
 */
export interface ApiResponse<T> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: ApiError;
    readonly requestId: string;
    readonly timestamp: Date;
}
export interface ApiError {
    readonly code: ErrorCode;
    readonly message: string;
    readonly details?: Record<string, unknown>;
}
export type ErrorCode = 'INVALID_REQUEST' | 'INVALID_ADDRESS' | 'INVALID_AMOUNT' | 'INSUFFICIENT_FUNDS' | 'MODEL_NOT_SUPPORTED' | 'JOB_NOT_FOUND' | 'NODE_NOT_FOUND' | 'JOB_ALREADY_ASSIGNED' | 'NODE_BUSY' | 'PROOF_VERIFICATION_FAILED' | 'INTERNAL_ERROR' | 'BLOCKCHAIN_ERROR' | 'ZK_VERIFICATION_ERROR';
/**
 * On-chain job registry
 *
 * AUDIT: This is the source of truth for payments. Any off-chain state
 * must eventually reconcile to these events.
 */
export interface JobRegistryEvent {
    readonly event: 'JobCreated' | 'JobAssigned' | 'JobCompleted' | 'JobDisputed' | 'PaymentReleased';
    readonly jobId: string;
    readonly blockNumber: number;
    readonly transactionHash: string;
    readonly timestamp: Date;
    readonly data: Record<string, unknown>;
}
/**
 * Token contract interface
 *
 * AUDIT: HSK token follows ERC-20 with extensions:
 * - permit() for gasless approvals
 * - burn() for deflationary mechanics
 */
export interface TokenContract {
    readonly address: string;
    readonly name: string;
    readonly symbol: string;
    readonly decimals: number;
    readonly totalSupply: string;
}
/**
 * Configuration for Synapse SDK
 *
 * AUDIT: All config values have defaults and validation ranges.
 * Invalid config must fail fast at initialization, not runtime.
 */
export interface SynapseConfig {
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly timeoutMs: number;
    readonly maxRetries: number;
    readonly chainId: number;
    readonly contractAddresses: {
        readonly jobRegistry: string;
        readonly token: string;
        readonly verifier: string;
    };
}
/**
 * Performance metrics for monitoring
 *
 * AUDIT: Metrics must not expose sensitive data (prompts, user addresses).
 * Aggregate only, with privacy-preserving sampling.
 */
export interface NetworkMetrics {
    readonly totalNodes: number;
    readonly onlineNodes: number;
    readonly totalJobs24h: number;
    readonly averageLatencyMs: number;
    readonly totalVolume24h: string;
    readonly activeUsers24h: number;
}
//# sourceMappingURL=types.d.ts.map