import { useMutation } from '@tanstack/react-query';
import { registerUsername } from '@/lib/contracts';
import type { WalletProvider } from '@/lib/keys/types';
import type { TransactionReceipt } from 'viem';

interface UseRegisterUsernameParams {
  provider: WalletProvider;
  account: `0x${string}`;
  usernameHash: `0x${string}`; // Privacy: now takes hash instead of plaintext
  commitment: `0x${string}`;
  proof: `0x${string}`;
}

/**
 * Hook for registering username on-chain (privacy-preserving)
 */
export function useRegisterUsername() {
  return useMutation<TransactionReceipt, Error, UseRegisterUsernameParams>({
    mutationFn: async ({ provider, account, usernameHash, commitment, proof }) => {
      return await registerUsername(provider, account, usernameHash, commitment, proof);
    },
    onError: (error) => {
      console.error('Failed to register username:', error);
    },
  });
}
