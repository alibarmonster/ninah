import { publicClient, createPrivyWalletClient } from '@/lib/contracts/client';
import { MockIDRXABI } from '@/lib/contracts/abi';
import { contractAddress } from '@/lib/contracts/addresses';
import type { WalletProvider } from '@/lib/keys/types';

const tokenAddress = contractAddress.MockIDRXAddress as `0x${string}`;

// READ FUNCTIONS

export async function getBalance(address: `0x${string}`): Promise<bigint> {
  return (await publicClient.readContract({
    address: tokenAddress,
    abi: MockIDRXABI,
    functionName: 'balanceOf',
    args: [address],
  })) as bigint;
}

export async function getAllowance(owner: `0x${string}`, spender: `0x${string}`): Promise<bigint> {
  return (await publicClient.readContract({
    address: tokenAddress,
    abi: MockIDRXABI,
    functionName: 'allowance',
    args: [owner, spender],
  })) as bigint;
}

export async function getDecimals(): Promise<number> {
  return (await publicClient.readContract({
    address: tokenAddress,
    abi: MockIDRXABI,
    functionName: 'decimals',
  })) as number;
}

// WRITE FUNCTIONS

export async function approve(
  provider: WalletProvider,
  account: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint,
) {
  const walletClient = createPrivyWalletClient(provider);

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: MockIDRXABI,
    functionName: 'approve',
    args: [spender, amount],
    account,
  });

  return await publicClient.waitForTransactionReceipt({
    hash,
  });
}

/**
 * Approve NinjaRupiah contract to spend tokens
 */

export async function approveNinjaRupiah(provider: WalletProvider, account: `0x${string}`, amount: bigint) {
  return await approve(provider, account, contractAddress.NinahContractAddress as `0x${string}`, amount);
}

export async function transfer(provider: WalletProvider, account: `0x${string}`, to: `0x${string}`, amount: bigint) {
  const walletClient = createPrivyWalletClient(provider);

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: MockIDRXABI,
    functionName: 'transfer',
    args: [to, amount],
    account,
  });

  return await publicClient.waitForTransactionReceipt({
    hash,
  });
}
