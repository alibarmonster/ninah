import { useMutation } from '@tanstack/react-query';
import { generateUsernameProof, type UsernameProofResponse } from '@/lib/api';

interface UseUsernameProofParams {
  username: string;
  wallet: string;
  secret: Uint8Array;
}

/**
 * Hook for generating username ZK proof (MOCK version)
 *
 * This mock version generates proofs locally without calling any backend.
 * The proof will be accepted by MockSP1Verifier as long as the public values match.
 */
export function useUsernameProof() {
  return useMutation<UsernameProofResponse, Error, UseUsernameProofParams>({
    mutationFn: async ({ username, wallet, secret }) => {
      // Mock proof generation - happens locally
      return await generateUsernameProof(username, wallet, secret);
    },
    onError: (error) => {
      console.error('Failed to generate username proof:', error);
    },
  });
}
