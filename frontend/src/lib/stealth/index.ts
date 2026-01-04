/**
 * Stealth Address Module for NinjaRupiah
 *
 * ## Overview:
 * Implements ERC-5564 stealth address protocol for privacy-preserving payments:
 * - **Stealth Address Generation**: Create one-time addresses for payments
 * - **Payment Scanning**: Detect incoming stealth payments
 * - **Private Key Derivation**: Derive keys to spend stealth payments
 *
 * ## How It Works:
 *
 * ### For Recipients:
 * 1. Register username with meta-address (viewing + spending public keys)
 * 2. Share username with senders
 * 3. Scan blockchain for incoming stealth payments
 * 4. Derive private keys to spend detected payments
 *
 * ### For Senders:
 * 1. Lookup recipient's meta-address by username
 * 2. Generate ephemeral keypair
 * 3. Derive stealth address using ECDH
 * 4. Send payment to stealth address with ephemeral public key
 *
 * ## Protocol Flow:
 *
 * ```
 * Sender:
 *   1. Generate ephemeral keypair (r, R = r·G)
 *   2. Compute shared secret: S = r·ViewPub
 *   3. Derive stealth address: StealthAddr = SpendPub + hash(S)·G
 *   4. Publish (StealthAddr, R) on-chain
 *
 * Recipient:
 *   1. Scan for ephemeral pubkeys (R)
 *   2. Compute shared secret: S = viewPriv·R
 *   3. Derive stealth address: StealthAddr' = spendPub + hash(S)·G
 *   4. If StealthAddr' == StealthAddr: payment is for me!
 *   5. Derive stealth private key: stealthPriv = spendPriv + hash(S)
 * ```
 *
 * ## Quick Start:
 *
 * ```typescript
 * import { Address } from '@/lib/stealth';
 *
 * // Sender: Generate stealth payment
 * const payment = Address.generateStealthPayment(
 *   recipientViewPub,
 *   recipientSpendPub
 * );
 * await contract.sendPayment(payment.stealthAddress, payment.ephemeralPublicKey);
 *
 * // Recipient: Check if payment is for me
 * const result = Address.checkStealthPayment(
 *   ephemeralPubkey,
 *   myViewingPriv,
 *   mySpendingPub,
 *   stealthAddress
 * );
 *
 * if (result.isForMe) {
 *   // Derive private key to spend
 *   const stealthPriv = Address.deriveStealthPrivateKey(
 *     mySpendingPriv,
 *     sharedSecret
 *   );
 * }
 * ```
 *
 * ## Exports:
 *
 * ### Classes:
 * - `Address` - Stealth address generation and scanning utilities
 *
 * ### Types:
 * - `StealthPayment` - Stealth payment information
 * - `MetaKeys` - Meta viewing and spending key pairs
 * - `PublicMetaKeys` - Public meta keys for registration
 * - `StealthPaymentGeneration` - Stealth payment generation result
 * - `PaymentScanResult` - Payment scanning result
 * - `ScannerConfig` - Blockchain scanner configuration
 * - `ClaimProofInputs` - Inputs for generating claim proofs
 *
 * @module stealth
 */

// Stealth address utilities
export { Address } from '@/lib/stealth/address';

// Types
export type {
  StealthPayment,
  MetaKeys,
  PublicMetaKeys,
  StealthPaymentGeneration,
  PaymentScanResult,
  ScannerConfig,
  ClaimProofInputs,
} from '@/lib/stealth/types';
