import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Use official Base Sepolia RPC
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Public client for read operations
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC),
});

// WalletProvider type for Privy integration
export interface WalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Create wallet client from Privy's provider
export function createPrivyWalletClient(provider: WalletProvider) {
  return createWalletClient({
    chain: baseSepolia,
    transport: custom(provider),
  });
}
