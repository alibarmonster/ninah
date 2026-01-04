import { NinahABI } from '@/lib/contracts/abi';
import { contractAddress } from '@/lib/contracts/addresses';
import type { WalletProvider } from '@/lib/keys/types';
import { createPrivyWalletClient, publicClient } from '@/lib/contracts/client';
import { Bytes } from '@/lib/helpers/bytes';
import { keccak256, toBytes } from 'viem';

const contractAdd = contractAddress.NinahContractAddress as `0x${string}`;

/**
 * READ FUNCTIONS CONTRACT
 */

/**
 * Check if a username is available (hashes the username for privacy)
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  // Hash the username before checking on-chain
  const usernameHash = keccak256(toBytes(username));
  return (await publicClient.readContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'isUsernameHashAvailable',
    args: [usernameHash],
  })) as boolean;
}

/**
 * Get username hash for an address (returns bytes32, not plaintext)
 */
export async function getUsernameHash(address: `0x${string}`): Promise<`0x${string}`> {
  return (await publicClient.readContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'getUsernameHash',
    args: [address],
  })) as `0x${string}`;
}

export async function getMetaKeys(address: `0x${string}`) {
  return await publicClient.readContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'getMetaKeys',
    args: [address],
  });
}

export async function getStealthPayment(address: `0x${string}`) {
  return await publicClient.readContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'getStealthPayment',
    args: [address],
  });
}

/**
 * WRITE FUNCTIONS CONTRACT
 */

/**
 * Register username with privacy - passes usernameHash instead of plaintext
 */
export async function registerUsername(
  provider: WalletProvider,
  account: `0x${string}`,
  usernameHash: `0x${string}`, // Changed from string username to bytes32 hash
  commitment: `0x${string}`,
  proof: `0x${string}`,
) {
  const walletClient = createPrivyWalletClient(provider);

  const hash = await walletClient.writeContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'RegisterUsername',
    args: [usernameHash, commitment, proof],
    account,
  });

  return await publicClient.waitForTransactionReceipt({
    hash,
  });
}

export async function registerMetaKeys(
  provider: WalletProvider,
  account: `0x${string}`,
  metaViewingPub: Uint8Array,
  metaSpendingPub: Uint8Array,
) {
  const walletClient = createPrivyWalletClient(provider);

  // Convert Uint8Array to hex string using Bytes helper
  const viewingPubHex = Bytes.bytesToHex(metaViewingPub) as `0x${string}`;
  const spendingPubHex = Bytes.bytesToHex(metaSpendingPub) as `0x${string}`;

  const hash = await walletClient.writeContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'registerMetaKeys',
    args: [viewingPubHex, spendingPubHex],
    account,
  });

  return await publicClient.waitForTransactionReceipt({
    hash,
  });
}

export async function sendToStealth(
  provider: WalletProvider,
  account: `0x${string}`,
  stealthAddress: `0x${string}`,
  amount: bigint,
  ephemeralPubkey: Uint8Array,
) {
  const walletClient = createPrivyWalletClient(provider);

  const hash = await walletClient.writeContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'sendToStealth',
    args: [stealthAddress, amount, ephemeralPubkey],
    account,
  });

  return await publicClient.waitForTransactionReceipt({
    hash,
  });
}

export async function claimFromStealth(
  provider: WalletProvider,
  account: `0x${string}`,
  stealthAddress: `0x${string}`,
  proof: `0x${string}`,
) {
  const walletClient = createPrivyWalletClient(provider);

  const hash = await walletClient.writeContract({
    address: contractAdd,
    abi: NinahABI,
    functionName: 'claimFromStealth',
    args: [stealthAddress, proof],
    account,
  });

  return await publicClient.waitForTransactionReceipt({
    hash,
  });
}
