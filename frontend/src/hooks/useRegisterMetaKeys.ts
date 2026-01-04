import { useMutation } from '@tanstack/react-query';
import { registerMetaKeys } from '@/lib/contracts';
import type { WalletProvider } from '@/lib/keys/types';
import type { TransactionReceipt } from 'viem';

interface UseRegisterMetaKeysParams {
  provider: WalletProvider;
  account: `0x${string}`;
  metaViewingPub: Uint8Array;
  metaSpendingPub: Uint8Array;
}

/**
 * Hook for registering meta keys on-chain
 */
export function useRegisterMetaKeys() {
  return useMutation<TransactionReceipt, Error, UseRegisterMetaKeysParams>({
    mutationFn: async ({ provider, account, metaViewingPub, metaSpendingPub }) => {
      return await registerMetaKeys(provider, account, metaViewingPub, metaSpendingPub);
    },
    onError: (error) => {
      console.error('Failed to register meta keys:', error);
    },
  });
}
