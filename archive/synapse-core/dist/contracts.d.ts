import { ethers } from 'ethers';
import type { InferenceJob, JobResult, EscrowState, JobRegistryEvent, ZKProof } from './types.js';
export declare class SynapseContracts {
    private readonly provider;
    private readonly signer?;
    private readonly jobRegistry;
    private readonly token;
    private readonly verifier;
    constructor(provider: ethers.Provider, contractAddresses: {
        jobRegistry: string;
        token: string;
        verifier: string;
    }, signer?: ethers.Signer);
    /**
     * Create a new inference job with escrow
     *
     * AUDIT: This locks user funds. Must verify:
     * 1. User has sufficient HSK balance
     * 2. Approved allowance covers maxPrice
     * 3. Job ID is unique (UUID collision check)
     * 4. Max price is reasonable (prevent fat-finger errors)
     */
    createJob(job: Omit<InferenceJob, 'status' | 'createdAt' | 'expiresAt'>, options?: {
        gasLimit?: number;
    }): Promise<ethers.TransactionResponse>;
    /**
     * Node assigns itself to a job
     *
     * AUDIT: Nodes must stake collateral before assigning to prevent spam.
     * Stake amount should be proportional to job value to prevent griefing.
     */
    assignJob(jobId: string, options?: {
        gasLimit?: number;
    }): Promise<ethers.TransactionResponse>;
    /**
     * Complete job and submit proof
     *
     * AUDIT: This is the critical security path. Proof must:
     * 1. Verify actual inference was performed
     * 2. Match the job parameters (input hash check)
     * 3. Be from the assigned node (prevent result stealing)
     * 4. Pass on-chain verification before payment
     */
    completeJob(jobId: string, result: JobResult, options?: {
        gasLimit?: number;
    }): Promise<ethers.TransactionResponse>;
    /**
     * User disputes job result
     *
     * AUDIT: Disputes require bond to prevent spam. Bond is forfeited if
     * dispute is frivolous. This creates economic incentive for honesty.
     */
    disputeJob(jobId: string, options?: {
        gasLimit?: number;
    }): Promise<ethers.TransactionResponse>;
    /**
     * Release payment to node after successful completion
     */
    releasePayment(jobId: string, options?: {
        gasLimit?: number;
    }): Promise<ethers.TransactionResponse>;
    /**
     * Get current job status from chain
     */
    getJobStatus(jobId: string): Promise<InferenceJob['status']>;
    /**
     * Get escrow state for a job
     */
    getEscrow(jobId: string): Promise<EscrowState>;
    /**
     * Verify ZK proof off-chain
     *
     * AUDIT: This is a view function - no transaction needed.
     * Used for pre-validation before expensive on-chain submission.
     */
    verifyProof(proof: ZKProof): Promise<boolean>;
    /**
     * Get HSK token balance
     */
    getBalance(address: string): Promise<string>;
    /**
     * Approve token spending for job registry
     */
    approveTokens(amount: string, options?: {
        gasLimit?: number;
    }): Promise<ethers.TransactionResponse>;
    /**
     * Listen for job registry events
     *
     * AUDIT: Event listeners should have automatic reconnection
     * and deduplication to prevent double-processing.
     */
    onJobCreated(callback: (event: JobRegistryEvent) => void): () => void;
    private priorityToUint;
    private uintToPriority;
}
export declare class ContractError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=contracts.d.ts.map