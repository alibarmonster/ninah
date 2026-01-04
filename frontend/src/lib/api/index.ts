// API Client
export { apiClient } from './client';

// Proof Generation (MOCK - generates proofs locally)
export {
  generateUsernameProof,
  generateClaimingProof,
  extractCommitmentFromPublicValues,
  extractUsernameHashFromPublicValues,
  encodeProofForContract,
  encodeClaimingProofForContract,
  type UsernameProofRequest,
  type UsernameProofResponse,
  type ClaimingProofRequest,
  type ClaimingProofResponse,
} from './proof';
