import { useMutation } from '@tanstack/react-query';
import { encodeClaimingProofForContract } from '@/lib/api';
import { keccak256 } from 'viem';
import { Bytes } from '@/lib/helpers/bytes';

interface UseClaimingProofParams {
  stealthAddress: `0x${string}`;
  ephemeralPubkey: `0x${string}`;
  claimerAddress: `0x${string}`;
}

interface ClaimingProofResult {
  proof: `0x${string}`;
}

/**
 * Hook for generating claiming ZK proof (MOCK version)
 *
 * This mock version generates proofs locally without calling any backend.
 * The proof will be accepted by MockSP1Verifier as long as the public values match.
 *
 * Note: This simplified mock version takes claimerAddress directly instead of private keys,
 * since the MockSP1Verifier doesn't actually verify the cryptographic proof.
 */
export function useClaimingProof() {
  return useMutation<ClaimingProofResult, Error, UseClaimingProofParams>({
    mutationFn: async ({ stealthAddress, ephemeralPubkey, claimerAddress }) => {
      // Calculate ephemeral pubkey hash (same as contract does)
      const ephemeralPubkeyBytes = Bytes.hexToBytes(ephemeralPubkey);
      const ephemeralPubkeyHash = keccak256(ephemeralPubkeyBytes);

      // Generate mock proof with correct public values
      const proof = encodeClaimingProofForContract(
        stealthAddress,
        ephemeralPubkeyHash,
        claimerAddress,
      );

      // Simulate small delay to mimic network request
      await new Promise(resolve => setTimeout(resolve, 100));

      return { proof };
    },
    onError: (error) => {
      console.error('Failed to generate claiming proof:', error);
    },
  });
}
