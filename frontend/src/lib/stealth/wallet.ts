import { createWalletClient, http, publicActions, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { Address } from '@/lib/stealth/address';
import { Ecdh } from '@/lib/crypto/ecdh';
import { Bytes } from '@/lib/helpers/bytes';
import { publicClient } from '@/lib/contracts/client';

/**
 * Stealth Wallet - Creates a wallet from a derived stealth private key
 *
 * ## Purpose:
 * After detecting a payment is for you, derive the stealth private key
 * and create a wallet that can sign transactions from the stealth address.
 *
 * ## Privacy Benefit:
 * When you send transactions FROM the stealth address, nobody can link
 * it to your main identity. The stealth address looks like any random EOA.
 *
 * ## Usage Flow:
 * 1. Detect payment via scanning (checkStealthPayment)
 * 2. Derive stealth private key (deriveStealthPrivateKey)
 * 3. Create stealth wallet (createStealthWallet)
 * 4. Transfer funds from stealth address to anywhere
 *
 * @example
 * ```typescript
 * // After detecting a payment is for you
 * const stealthWallet = await createStealthWallet(
 *   ephemeralPubkey,
 *   myViewingPriv,
 *   mySpendingPriv
 * );
 *
 * // Transfer IDRX from stealth address to your main wallet (or anywhere)
 * const hash = await stealthWallet.transferToken(
 *   IDRX_ADDRESS,
 *   recipientAddress,
 *   amount
 * );
 * ```
 */

export interface PermitSignature {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  deadline: bigint;
  nonce: bigint;
}

export interface StealthWallet {
  /** The stealth address (derived EOA) */
  address: `0x${string}`;
  /** The derived stealth private key (keep secret!) */
  privateKey: `0x${string}`;
  /** Viem wallet client for signing transactions */
  walletClient: ReturnType<typeof createWalletClient>;
  /** Transfer native ETH from stealth address */
  transferETH: (to: `0x${string}`, amount: bigint) => Promise<`0x${string}`>;
  /** Transfer ERC20 token from stealth address */
  transferToken: (tokenAddress: `0x${string}`, to: `0x${string}`, amount: bigint) => Promise<`0x${string}`>;
  /** Get ETH balance of stealth address */
  getETHBalance: () => Promise<bigint>;
  /** Get ERC20 token balance of stealth address */
  getTokenBalance: (tokenAddress: `0x${string}`) => Promise<bigint>;
  /**
   * Sign a permit for gasless token approval (EIP-2612)
   * The signature can be used by another wallet to call permit() + transferFrom()
   */
  signPermit: (
    tokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
    deadline?: bigint,
  ) => Promise<PermitSignature>;
  /** Zero the private key from memory (call when done) */
  destroy: () => void;
}

/**
 * Create a wallet from stealth private key
 *
 * @param ephemeralPubkey - The ephemeral public key from the payment (33 bytes)
 * @param metaViewingPriv - Your meta viewing private key (32 bytes)
 * @param metaSpendingPriv - Your meta spending private key (32 bytes)
 * @returns StealthWallet object with signing capabilities
 */
export async function createStealthWallet(
  ephemeralPubkey: Uint8Array,
  metaViewingPriv: Uint8Array,
  metaSpendingPriv: Uint8Array,
): Promise<StealthWallet> {
  // Compute shared secret
  const sharedSecret = Ecdh.computeSharedSecret(metaViewingPriv, ephemeralPubkey);

  // Derive stealth private key
  const stealthPrivKeyBytes = Address.deriveStealthPrivateKey(metaSpendingPriv, sharedSecret);
  const stealthPrivKey = Bytes.bytesToHex(stealthPrivKeyBytes) as `0x${string}`;

  // Create account from private key
  const account = privateKeyToAccount(stealthPrivKey);

  // Create wallet client with public actions for reading
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  }).extend(publicActions);

  // ERC20 transfer ABI
  const erc20TransferAbi = [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const;

  return {
    address: account.address,
    privateKey: stealthPrivKey,
    walletClient,

    async transferETH(to: `0x${string}`, amount: bigint): Promise<`0x${string}`> {
      const hash = await walletClient.sendTransaction({
        to,
        value: amount,
      });
      return hash;
    },

    async transferToken(tokenAddress: `0x${string}`, to: `0x${string}`, amount: bigint): Promise<`0x${string}`> {
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20TransferAbi,
        functionName: 'transfer',
        args: [to, amount],
      });
      return hash;
    },

    async getETHBalance(): Promise<bigint> {
      return await walletClient.getBalance({ address: account.address });
    },

    async getTokenBalance(tokenAddress: `0x${string}`): Promise<bigint> {
      const balance = await walletClient.readContract({
        address: tokenAddress,
        abi: erc20TransferAbi,
        functionName: 'balanceOf',
        args: [account.address],
      });
      return balance as bigint;
    },

    async signPermit(
      tokenAddress: `0x${string}`,
      spender: `0x${string}`,
      amount: bigint,
      deadline?: bigint,
    ): Promise<PermitSignature> {
      // EIP-2612 Permit ABI
      const permitAbi = [
        {
          name: 'nonces',
          type: 'function',
          inputs: [{ name: 'owner', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
        {
          name: 'name',
          type: 'function',
          inputs: [],
          outputs: [{ name: '', type: 'string' }],
        },
      ] as const;

      // Get nonce and token name
      const [nonce, tokenName] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: permitAbi,
          functionName: 'nonces',
          args: [account.address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: tokenAddress,
          abi: permitAbi,
          functionName: 'name',
        }) as Promise<string>,
      ]);

      // Default deadline: 1 hour from now
      const permitDeadline = deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600);

      // EIP-712 domain
      const domain = {
        name: tokenName,
        version: '1',
        chainId: baseSepolia.id,
        verifyingContract: tokenAddress,
      };

      // EIP-712 types for Permit
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      };

      // Permit message
      const message = {
        owner: account.address,
        spender,
        value: amount,
        nonce,
        deadline: permitDeadline,
      };

      // Sign the typed data
      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
      });

      // Split signature into r, s, v
      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);

      return {
        v,
        r,
        s,
        deadline: permitDeadline,
        nonce,
      };
    },

    destroy() {
      // Zero the private key bytes
      stealthPrivKeyBytes.fill(0);
      // Note: We can't easily zero the hex string in JS, but this helps
      console.log('[StealthWallet] Destroyed - private key zeroed');
    },
  };
}

/**
 * Verify that a stealth address matches the expected derivation
 *
 * @param ephemeralPubkey - The ephemeral public key from the payment
 * @param metaViewingPriv - Your meta viewing private key
 * @param metaSpendingPriv - Your meta spending private key
 * @param expectedStealthAddress - The stealth address to verify
 * @returns true if the address matches
 */
export function verifyStealthAddress(
  ephemeralPubkey: Uint8Array,
  metaViewingPriv: Uint8Array,
  metaSpendingPub: Uint8Array,
  expectedStealthAddress: Uint8Array,
): boolean {
  const result = Address.checkStealthPayment(ephemeralPubkey, metaViewingPriv, metaSpendingPub, expectedStealthAddress);
  return result.isForMe;
}
