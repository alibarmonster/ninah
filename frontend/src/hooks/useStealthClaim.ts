import { useState, useCallback } from 'react';
import { createStealthWallet, type StealthWallet } from '@/lib/stealth/wallet';
import { Bytes } from '@/lib/helpers/bytes';
import { contractAddress } from '@/lib/contracts/addresses';
import { publicClient } from '@/lib/contracts';
import { formatUnits, encodeFunctionData } from 'viem';

export type ClaimStatus = 'idle' | 'deriving' | 'checking' | 'signing' | 'transferring' | 'success' | 'error';

export interface ClaimResult {
  txHash: `0x${string}`;
  amount: string;
  fromStealthAddress: `0x${string}`;
  toAddress: `0x${string}`;
}

export interface StealthPaymentToClaim {
  stealthAddress: `0x${string}`;
  ephemeralPubkey: `0x${string}`;
  amount: bigint;
  sender: `0x${string}`;
  timestamp: number;
}

/**
 * Hook for claiming stealth payments using Option 2 (Stealth as EOA)
 *
 * ## How it works:
 * 1. User provides their meta private keys
 * 2. We derive the stealth private key for each payment
 * 3. Create a wallet from the stealth private key
 * 4. Transfer tokens from stealth address to destination
 *
 * ## Privacy:
 * - The stealth address signs the transaction directly
 * - msg.sender = stealth address (not your main wallet)
 * - Nobody can link the stealth address to your identity
 *
 * ## Note:
 * This requires the contract to send tokens TO stealth addresses
 * rather than holding them. For current contract, falls back to
 * generating a fresh destination address.
 */
export function useStealthClaim() {
  const [status, setStatus] = useState<ClaimStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimResult | null>(null);

  /**
   * Claim a stealth payment using permit (gasless via paymaster)
   *
   * Flow:
   * 1. Derive stealth wallet from meta keys
   * 2. Stealth wallet signs EIP-2612 permit (off-chain, no gas)
   * 3. Main wallet calls permit + transferFrom (gasless via Coinbase Paymaster)
   *
   * @param payment - The payment to claim
   * @param metaViewingPriv - Your meta viewing private key (32 bytes)
   * @param metaSpendingPriv - Your meta spending private key (32 bytes)
   * @param destinationAddress - Where to send the claimed funds
   * @param smartWalletClient - Privy Smart Wallet client (for gasless transactions)
   * @returns ClaimResult with transaction details
   */
  const claimPayment = useCallback(
    async (
      payment: StealthPaymentToClaim,
      metaViewingPriv: Uint8Array,
      metaSpendingPriv: Uint8Array,
      destinationAddress: `0x${string}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      smartWalletClient?: any
    ): Promise<ClaimResult | null> => {
      setStatus('deriving');
      setError(null);
      setResult(null);

      let stealthWallet: StealthWallet | null = null;

      try {
        // Convert ephemeral pubkey from hex to bytes
        const ephemeralPubkeyBytes = Bytes.hexToBytes(payment.ephemeralPubkey);

        console.log('[CLAIM] Deriving stealth wallet...');
        console.log('[CLAIM] Stealth address:', payment.stealthAddress);
        console.log('[CLAIM] Ephemeral pubkey:', payment.ephemeralPubkey);

        // Create stealth wallet from derived private key
        stealthWallet = await createStealthWallet(
          ephemeralPubkeyBytes,
          metaViewingPriv,
          metaSpendingPriv
        );

        console.log('[CLAIM] Derived stealth wallet address:', stealthWallet.address);

        // Verify the derived address matches
        if (stealthWallet.address.toLowerCase() !== payment.stealthAddress.toLowerCase()) {
          throw new Error(
            `Derived address mismatch! Expected ${payment.stealthAddress}, got ${stealthWallet.address}`
          );
        }

        console.log('[CLAIM] Address verification passed!');

        // Check token balance at stealth address
        setStatus('checking');
        const idrxAddress = contractAddress.MockIDRXAddress as `0x${string}`;
        const tokenBalance = await stealthWallet.getTokenBalance(idrxAddress);

        console.log('[CLAIM] Stealth address IDRX balance:', formatUnits(tokenBalance, 6));

        if (tokenBalance === BigInt(0)) {
          throw new Error('No tokens found at stealth address');
        }

        // Use permit-based gasless transfer if smart wallet is available
        if (smartWalletClient) {
          console.log('[CLAIM] Using gasless permit flow via paymaster...');

          // Step 1: Sign permit with stealth wallet (off-chain, no gas)
          setStatus('signing');
          console.log('[CLAIM] Signing permit...');

          const permitSignature = await stealthWallet.signPermit(
            idrxAddress,
            destinationAddress, // spender = destination (will receive via transferFrom)
            tokenBalance
          );

          console.log('[CLAIM] Permit signed:', permitSignature);

          // Step 2: Main wallet calls permit + transferFrom (gasless via paymaster)
          setStatus('transferring');

          // Permit ABI
          const permitAbi = [
            {
              name: 'permit',
              type: 'function',
              inputs: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
                { name: 'v', type: 'uint8' },
                { name: 'r', type: 'bytes32' },
                { name: 's', type: 'bytes32' },
              ],
              outputs: [],
            },
            {
              name: 'transferFrom',
              type: 'function',
              inputs: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ name: '', type: 'bool' }],
            },
          ] as const;

          // Encode permit call
          const permitData = encodeFunctionData({
            abi: permitAbi,
            functionName: 'permit',
            args: [
              stealthWallet.address, // owner
              destinationAddress, // spender
              tokenBalance, // value
              permitSignature.deadline, // deadline
              permitSignature.v, // v
              permitSignature.r, // r
              permitSignature.s, // s
            ],
          });

          // Encode transferFrom call
          const transferData = encodeFunctionData({
            abi: permitAbi,
            functionName: 'transferFrom',
            args: [
              stealthWallet.address, // from (stealth)
              destinationAddress, // to
              tokenBalance, // amount
            ],
          });

          console.log('[CLAIM] Calling permit...');
          // Call permit
          const permitTxHash = await smartWalletClient.sendTransaction({
            to: idrxAddress,
            data: permitData,
          });
          await publicClient.waitForTransactionReceipt({ hash: permitTxHash });
          console.log('[CLAIM] Permit tx:', permitTxHash);

          console.log('[CLAIM] Calling transferFrom...');
          // Call transferFrom
          const txHash = await smartWalletClient.sendTransaction({
            to: idrxAddress,
            data: transferData,
          });
          await publicClient.waitForTransactionReceipt({ hash: txHash });
          console.log('[CLAIM] TransferFrom tx:', txHash);

          const claimResult: ClaimResult = {
            txHash,
            amount: formatUnits(tokenBalance, 6),
            fromStealthAddress: stealthWallet.address,
            toAddress: destinationAddress,
          };

          setResult(claimResult);
          setStatus('success');

          return claimResult;
        }

        // Fallback: Direct transfer (requires ETH for gas)
        const ethBalance = await stealthWallet.getETHBalance();
        console.log('[CLAIM] - ETH:', formatUnits(ethBalance, 18));

        if (ethBalance === BigInt(0)) {
          throw new Error(
            'Stealth address has no ETH for gas. Pass smartWalletClient for gasless claiming via permit.'
          );
        }

        // Transfer tokens from stealth address to destination
        setStatus('transferring');
        console.log('[CLAIM] Transferring', formatUnits(tokenBalance, 6), 'IDRX to', destinationAddress);

        const txHash = await stealthWallet.transferToken(idrxAddress, destinationAddress, tokenBalance);

        console.log('[CLAIM] Transfer successful! Tx:', txHash);

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        const claimResult: ClaimResult = {
          txHash,
          amount: formatUnits(tokenBalance, 6),
          fromStealthAddress: stealthWallet.address,
          toAddress: destinationAddress,
        };

        setResult(claimResult);
        setStatus('success');

        return claimResult;
      } catch (err) {
        console.error('[CLAIM] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to claim payment');
        setStatus('error');
        return null;
      } finally {
        // Clean up: zero private key from memory
        if (stealthWallet) {
          stealthWallet.destroy();
        }
      }
    },
    []
  );

  /**
   * Verify that a payment can be claimed (without actually claiming)
   * Useful to check derivation works before committing
   */
  const verifyPayment = useCallback(
    async (
      payment: StealthPaymentToClaim,
      metaViewingPriv: Uint8Array,
      metaSpendingPriv: Uint8Array
    ): Promise<{ valid: boolean; derivedAddress: `0x${string}` | null; error?: string }> => {
      let stealthWallet: StealthWallet | null = null;

      try {
        const ephemeralPubkeyBytes = Bytes.hexToBytes(payment.ephemeralPubkey);

        stealthWallet = await createStealthWallet(
          ephemeralPubkeyBytes,
          metaViewingPriv,
          metaSpendingPriv
        );

        const matches =
          stealthWallet.address.toLowerCase() === payment.stealthAddress.toLowerCase();

        return {
          valid: matches,
          derivedAddress: stealthWallet.address,
          error: matches ? undefined : 'Derived address does not match stealth address',
        };
      } catch (err) {
        return {
          valid: false,
          derivedAddress: null,
          error: err instanceof Error ? err.message : 'Verification failed',
        };
      } finally {
        if (stealthWallet) {
          stealthWallet.destroy();
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return {
    status,
    error,
    result,
    claimPayment,
    verifyPayment,
    reset,
  };
}
