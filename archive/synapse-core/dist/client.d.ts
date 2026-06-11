import { z } from 'zod';
import type { ApiResponse, InferenceJob, JobResult, NodeInfo, SynapseConfig, NetworkMetrics } from './types.js';
/**
 * Input validation schemas for API methods
 * Prevents injection attacks and malformed requests
 */
declare const CreateJobSchema: z.ZodObject<{
    modelId: z.ZodString;
    prompt: z.ZodString;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    temperature: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high", "urgent"]>>;
}, "strip", z.ZodTypeAny, {
    modelId: string;
    prompt: string;
    maxTokens: number;
    temperature: number;
    priority: "low" | "normal" | "high" | "urgent";
}, {
    modelId: string;
    prompt: string;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    priority?: "low" | "normal" | "high" | "urgent" | undefined;
}>;
export declare class SynapseClient {
    private readonly config;
    private readonly headers;
    private requestCounter;
    constructor(config: Partial<SynapseConfig> & {
        apiKey: string;
    });
    /**
     * Submit an inference job to the mesh
     *
     * AUDIT: This is the primary attack surface. Input validation and
     * rate limiting are critical to prevent spam and resource exhaustion.
     */
    createJob(params: z.infer<typeof CreateJobSchema>): Promise<ApiResponse<InferenceJob>>;
    /**
     * Poll for job result
     *
     * AUDIT: Polling must have backoff to prevent thundering herd.
     * Exponential backoff with jitter spreads load across time.
     */
    getJobResult(jobId: string, options?: {
        timeoutMs?: number;
        pollIntervalMs?: number;
    }): Promise<ApiResponse<JobResult>>;
    /**
     * List available nodes and their status
     *
     * AUDIT: Node list is public information but must be cached to
     * prevent DoS on the registry. Client-side caching reduces server load.
     */
    listNodes(options?: {
        region?: string;
        modelId?: string;
        minReputation?: number;
        limit?: number;
    }): Promise<ApiResponse<NodeInfo[]>>;
    /**
     * Get network-wide metrics
     */
    getMetrics(): Promise<ApiResponse<NetworkMetrics>>;
    /**
     * Fetch with exponential backoff retry
     *
     * AUDIT: Retry logic prevents transient failures from breaking UX,
     * but must not amplify errors. Exponential backoff prevents thundering herd.
     */
    private fetchWithRetry;
    /**
     * Parse error response from server
     * AUDIT: Error responses must not leak sensitive internal details
     */
    private parseErrorResponse;
    private handleNetworkError;
    private createErrorResponse;
    private generateRequestId;
    private sleep;
    private deserializeJob;
    private deserializeResult;
    private deserializeNode;
    private deserializeMetrics;
}
/**
 * Custom error classes for better error handling
 */
export declare class SynapseError extends Error {
    constructor(message: string);
}
export declare class SynapseValidationError extends SynapseError {
    constructor(message: string);
}
export {};
//# sourceMappingURL=client.d.ts.map