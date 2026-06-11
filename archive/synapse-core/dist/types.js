import { z } from 'zod';
/**
 * Core type definitions for Synapse Network
 *
 * AUDIT: All external inputs must pass through these schemas before processing.
 * This prevents runtime type errors and malicious input injection.
 */
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
/**
 * HSK Token amount validation
 * - Must be positive
 * - Max 18 decimal places (ERC-20 standard)
 * - String representation to avoid floating point errors
 */
export const TokenAmountSchema = z.string().regex(/^\d+(\.\d{1,18})?$/, 'Invalid token amount format').refine((val) => parseFloat(val) >= 0, 'Token amount must be non-negative');
/**
 * Ethereum address validation
 * - Must be 0x prefix + 40 hex characters
 * - Case-insensitive (will normalize to checksum)
 */
export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format').transform((addr) => addr.toLowerCase());
/**
 * Node ID validation
 * - UUID v4 format for global uniqueness
 * - Prevents collision attacks
 */
export const NodeIdSchema = z.string().uuid('Invalid node ID format');
/**
 * Model identifier validation
 * - Alphanumeric + hyphens/underscores
 * - Max 64 chars to prevent DB bloat
 */
export const ModelIdSchema = z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid model ID format')
    .min(1)
    .max(64);
//# sourceMappingURL=types.js.map