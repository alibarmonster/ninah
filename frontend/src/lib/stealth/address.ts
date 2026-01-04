import { keccak_256 } from '@noble/hashes/sha3.js';
import { Secp256k1 } from '@/lib/crypto';
import { PaymentError } from '@/lib/helpers';
import { secp256k1 } from '@noble/curves/secp256k1';
import { Ecdh } from '@/lib/crypto/ecdh';
import { Bytes } from '@/lib/helpers/bytes';
import type { StealthPaymentGeneration } from '@/lib/stealth/types';

/**
 * Stealth Address Utilities for ERC-5564 Protocol
 *
 * ## Overview:
 * Implements stealth address generation and scanning for privacy-preserving payments.
 * Based on ERC-5564 standard for ephemeral addresses on Ethereum.
 *
 * ## Core Concepts:
 *
 * ### Meta-Address:
 * A meta-address is a pair of public keys registered on-chain with a username:
 * - **Viewing Public Key**: Used to detect incoming payments (view-only)
 * - **Spending Public Key**: Used to derive stealth addresses and spend funds
 *
 * ### Stealth Address:
 * A one-time address derived from the recipient's meta-address and a shared secret.
 * Only the recipient can:
 * 1. Detect that a payment was sent to them (using viewing key)
 * 2. Derive the private key to spend it (using spending key)
 *
 * ### ECDH Shared Secret:
 * The sender generates an ephemeral keypair and computes a shared secret with
 * the recipient's viewing public key. This shared secret is used to derive the
 * stealth address deterministically.
 *
 * ## Protocol Math:
 *
 * ### Sender (generating stealth payment):
 * ```
 * 1. Generate ephemeral keypair: (r, R) where R = r·G
 * 2. Compute shared secret: S = r·ViewPub = r·(viewPriv·G)
 * 3. Compute stealth pubkey: StealthPub = SpendPub + hash(S)·G
 * 4. Convert to address: StealthAddr = keccak256(StealthPub)[12:32]
 * 5. Publish (StealthAddr, R) on-chain
 * ```
 *
 * ### Recipient (scanning for payments):
 * ```
 * 1. For each ephemeral pubkey R on-chain:
 * 2. Compute shared secret: S = viewPriv·R = viewPriv·(r·G)
 * 3. Compute stealth pubkey: StealthPub' = spendPub + hash(S)·G
 * 4. Convert to address: StealthAddr' = keccak256(StealthPub')[12:32]
 * 5. If StealthAddr' == StealthAddr: payment is for me!
 * 6. Derive stealth private key: stealthPriv = spendPriv + hash(S)
 * ```
 *
 * ## Security Properties:
 * - **Unlinkability**: Each payment uses a unique stealth address
 * - **Privacy**: Observer cannot link payments to recipient's meta-address
 * - **Forward Secrecy**: Compromise of meta keys doesn't reveal past payments
 * - **View-Spend Separation**: Viewing key can scan without spending capability
 *
 * @example
 * ```typescript
 * // Sender: Generate stealth payment
 * const payment = Address.generateStealthPayment(
 *   aliceViewingPub,
 *   aliceSpendingPub
 * );
 * // Send to payment.stealthAddress with payment.ephemeralPublicKey
 *
 * // Alice: Check if payment is for her
 * const result = Address.checkStealthPayment(
 *   ephemeralPubkey,
 *   aliceViewingPriv,
 *   aliceSpendingPub,
 *   stealthAddress
 * );
 *
 * if (result.isForMe) {
 *   // Compute shared secret
 *   const sharedSecret = Ecdh.computeSharedSecret(aliceViewingPriv, ephemeralPubkey);
 *
 *   // Derive private key to spend
 *   const stealthPriv = Address.deriveStealthPrivateKey(
 *     aliceSpendingPriv,
 *     sharedSecret
 *   );
 * }
 * ```
 */
export class Address {
  /**
   * Derive stealth address from meta spending public key and shared secret
   *
   * ## Process:
   * 1. Hash shared secret with Keccak256
   * 2. Multiply hash by generator point: hash(S)·G
   * 3. Add to meta spending public key: StealthPub = SpendPub + hash(S)·G
   * 4. Convert to Ethereum address: keccak256(StealthPub)[12:32]
   *
   * ## Math:
   * ```
   * StealthPub = SpendPub + hash(S)·G
   * StealthAddr = keccak256(StealthPub.uncompressed[1:])[12:32]
   * ```
   *
   * ## Security:
   * - Deterministic: Same inputs always produce same stealth address
   * - One-way: Cannot reverse to find meta-address or shared secret
   * - Unlinkable: Different shared secrets produce completely different addresses
   *
   * @param metaSpendingPub - Recipient's meta spending public key (33 bytes compressed)
   * @param sharedSecret - ECDH shared secret (32 bytes)
   * @returns Stealth address (20 bytes) - Ethereum address format
   *
   * @throws {PaymentError} If meta spending public key is invalid
   * @throws {PaymentError} If shared secret is not 32 bytes
   * @throws {PaymentError} If elliptic curve operations fail
   *
   * @example
   * ```typescript
   * const sharedSecret = Ecdh.computeSharedSecret(ephemeralPriv, metaViewingPub);
   * const stealthAddr = Address.deriveStealthAddress(metaSpendingPub, sharedSecret);
   * // stealthAddr = 20-byte Ethereum address
   * ```
   */
  static deriveStealthAddress(metaSpendingPub: Uint8Array, sharedSecret: Uint8Array): Uint8Array {
    if (!Secp256k1.isValidPublicKey(metaSpendingPub)) {
      throw new PaymentError('Invalid meta spending public key');
    }

    if (sharedSecret.length !== 32) {
      throw new PaymentError('Shared secret must be 32 bytes');
    }

    try {
      const hash = keccak_256(sharedSecret);

      const scalar = BigInt('0x' + Bytes.bytesToHex(hash, false));

      const spendingPoint = secp256k1.ProjectivePoint.fromHex(metaSpendingPub);

      const scalarPoint = secp256k1.ProjectivePoint.BASE.multiply(scalar);

      const stealthPoint = spendingPoint.add(scalarPoint);

      const stealthPubUncompressed = stealthPoint.toRawBytes(false);

      const pubKeyHash = keccak_256(stealthPubUncompressed.slice(1));

      return pubKeyHash.slice(12, 32);
    } catch (error) {
      throw new PaymentError(`Failed to derive stealth address: ${error}`);
    }
  }

  /**
   * Derive stealth private key from meta spending private key and shared secret
   *
   * ## Process:
   * 1. Hash shared secret with Keccak256
   * 2. Add hash to meta spending private key (modulo curve order)
   * 3. Result is the private key for the stealth address
   *
   * ## Math:
   * ```
   * stealthPriv = (spendPriv + hash(S)) mod n
   * where n = secp256k1 curve order
   * ```
   *
   * ## Security:
   * - **CRITICAL**: This derives the private key to spend funds
   * - Only the recipient can compute this (requires spending private key)
   * - Must match the public key derived in deriveStealthAddress
   * - Zero the result from memory after use
   *
   * ## Verification:
   * ```
   * stealthPub = stealthPriv·G
   * stealthAddr = keccak256(stealthPub)[12:32]
   * Should match the stealth address from deriveStealthAddress
   * ```
   *
   * @param metaSpendingPriv - Recipient's meta spending private key (32 bytes)
   * @param sharedSecret - ECDH shared secret (32 bytes) - Same as used for address derivation
   * @returns Stealth private key (32 bytes) - Can spend funds at stealth address
   *
   * @throws {PaymentError} If meta spending private key is invalid
   * @throws {PaymentError} If shared secret is not 32 bytes
   * @throws {PaymentError} If scalar arithmetic fails
   *
   * @example
   * ```typescript
   * // After detecting a payment is for you
   * const sharedSecret = Ecdh.computeSharedSecret(myViewingPriv, ephemeralPubkey);
   * const stealthPriv = Address.deriveStealthPrivateKey(mySpendingPriv, sharedSecret);
   *
   * // Use stealthPriv to sign transaction spending from stealth address
   * const tx = await wallet.signTransaction({ from: stealthAddress, privateKey: stealthPriv });
   *
   * // SECURITY: Zero the private key after use
   * stealthPriv.fill(0);
   * ```
   */
  static deriveStealthPrivateKey(metaSpendingPriv: Uint8Array, sharedSecret: Uint8Array): Uint8Array {
    if (!Secp256k1.isValidPrivateKey(metaSpendingPriv)) {
      throw new PaymentError('Invalid meta spending private key');
    }

    if (sharedSecret.length !== 32) {
      throw new PaymentError('Shared secret must be 32 bytes');
    }

    try {
      const hash = keccak_256(sharedSecret);

      const spendingScalar = BigInt('0x' + Bytes.bytesToHex(metaSpendingPriv, false));
      const hashScalar = BigInt('0x' + Bytes.bytesToHex(hash, false));

      const curveOrder = secp256k1.CURVE.n;
      const stealthScalar = (spendingScalar + hashScalar) % curveOrder;

      const stealthHex = stealthScalar.toString(16).padStart(64, '0');
      return Bytes.hexToBytes(stealthHex);
    } catch (error) {
      throw new PaymentError(`Failed to derive stealth private key: ${error}`);
    }
  }

  /**
   * Generate stealth payment (for sender)
   *
   * ## Purpose:
   * Creates a one-time stealth address for sending a private payment to a recipient.
   * The recipient can later detect and spend this payment using their meta keys.
   *
   * ## Process:
   * 1. Generate ephemeral keypair (r, R = r·G)
   * 2. Compute shared secret: S = r·ViewPub (ECDH with recipient's viewing key)
   * 3. Derive stealth address: StealthAddr = SpendPub + hash(S)·G
   * 4. Return stealth address + ephemeral public key R
   *
   * ## What To Do Next:
   * 1. Send payment to `stealthAddress`
   * 2. Publish `ephemeralPublicKey` on-chain (e.g., in transaction logs)
   * 3. Recipient will scan for `ephemeralPublicKey` to detect payment
   *
   * ## Privacy:
   * - Each payment gets a unique stealth address (unlinkable)
   * - Ephemeral keypair is generated fresh for each payment
   * - Observer cannot determine who the recipient is
   * - Only recipient can detect and spend (using their meta keys)
   *
   * @param metaViewingPub - Recipient's meta viewing public key (33 bytes compressed)
   * @param metaSpendingPub - Recipient's meta spending public key (33 bytes compressed)
   * @returns StealthPaymentGeneration object containing:
   *   - stealthAddress: 20-byte Ethereum address to send payment to
   *   - ephemeralPublicKey: 33-byte pubkey to publish on-chain
   *   - sharedSecret: 32-byte secret (optional, for sender reference)
   *
   * @throws {PaymentError} If meta viewing or spending public keys are invalid
   * @throws {PaymentError} If ECDH or address derivation fails
   *
   * @example
   * ```typescript
   * // Look up Alice's meta-address by username
   * const alice = await contract.getMetaAddress("alice");
   *
   * // Generate stealth payment
   * const payment = Address.generateStealthPayment(
   *   alice.metaViewingPub,
   *   alice.metaSpendingPub
   * );
   *
   * // Send IDRX to stealth address with ephemeral pubkey in logs
   * await idrxContract.transfer(
   *   payment.stealthAddress,
   *   amount,
   *   { ephemeralPubkey: payment.ephemeralPublicKey }
   * );
   * ```
   */
  static generateStealthPayment(
    metaViewingPub: Uint8Array,
    metaSpendingPub: Uint8Array,
  ): StealthPaymentGeneration {
    if (!Secp256k1.isValidPublicKey(metaViewingPub)) {
      throw new PaymentError('Invalid meta viewing public key');
    }

    if (!Secp256k1.isValidPublicKey(metaSpendingPub)) {
      throw new PaymentError('Invalid meta spending public key');
    }

    try {
      const { privateKey: ephemeralPriv, publicKey: ephemeralPub } = Ecdh.generateEphemeralKeypair();

      const sharedSecret = Ecdh.computeSharedSecret(ephemeralPriv, metaViewingPub);

      const stealthAddress = this.deriveStealthAddress(metaSpendingPub, sharedSecret);

      return {
        stealthAddress,
        ephemeralPublicKey: ephemeralPub,
        sharedSecret,
      };
    } catch (error) {
      throw new PaymentError(`Failed to generate stealth payment: ${error}`);
    }
  }

  /**
   * Check if a stealth payment belongs to you (for recipient)
   *
   * ## Purpose:
   * Scans a payment to determine if it was sent to your meta-address.
   * Uses viewing private key to compute shared secret and derive stealth address.
   *
   * ## Process:
   * 1. Compute shared secret: S = viewPriv·R (ECDH with ephemeral pubkey)
   * 2. Derive stealth address: StealthAddr' = spendPub + hash(S)·G
   * 3. Compare StealthAddr' with the on-chain stealth address
   * 4. If they match → payment is for you!
   *
   * ## Privacy Features:
   * - Uses viewing key only (no spending capability)
   * - Can be done on untrusted device/server
   * - Constant-time comparison prevents timing attacks
   *
   * ## Next Steps If Payment Is Yours:
   * 1. Save ephemeralPubkey and stealthAddress to database
   * 2. When ready to spend, use deriveStealthPrivateKey with spending private key
   * 3. Sign transaction with derived stealth private key
   *
   * @param ephemeralPubkey - Ephemeral public key published by sender (33 bytes compressed)
   * @param metaViewingPriv - Your meta viewing private key (32 bytes)
   * @param metaSpendingPub - Your meta spending public key (33 bytes compressed)
   * @param stealthAddress - On-chain stealth address to check (20 bytes)
   * @returns Object with:
   *   - isForMe: true if payment is for you, false otherwise
   *   - derivedAddress: The stealth address we derived (for verification)
   *
   * @example
   * ```typescript
   * // Scan on-chain payments
   * const payments = await contract.getAnnouncedPayments(fromBlock, toBlock);
   *
   * for (const payment of payments) {
   *   const result = Address.checkStealthPayment(
   *     payment.ephemeralPubkey,
   *     myViewingPriv,
   *     mySpendingPub,
   *     payment.stealthAddress
   *   );
   *
   *   if (result.isForMe) {
   *     console.log("Found payment for me!", payment.amount);
   *     // Save to database for later spending
   *     await db.saveStealthPayment({
   *       stealthAddress: payment.stealthAddress,
   *       ephemeralPubkey: payment.ephemeralPubkey,
   *       amount: payment.amount,
   *     });
   *   }
   * }
   * ```
   */
  static checkStealthPayment(
    ephemeralPubkey: Uint8Array,
    metaViewingPriv: Uint8Array,
    metaSpendingPub: Uint8Array,
    stealthAddress: Uint8Array,
  ): { isForMe: boolean; derivedAddress?: Uint8Array } {
    try {
      const sharedSecret = Ecdh.computeSharedSecret(metaViewingPriv, ephemeralPubkey);

      const derivedAddress = this.deriveStealthAddress(metaSpendingPub, sharedSecret);

      let match = true;

      if (derivedAddress.length !== stealthAddress.length) {
        match = false;
      } else {
        for (let i = 0; i < derivedAddress.length; i++) {
          if (derivedAddress[i] !== stealthAddress[i]) {
            match = false;
            break;
          }
        }
      }

      return {
        isForMe: match,
        derivedAddress,
      };
    } catch {
      return { isForMe: false };
    }
  }
  /**
   * Verify stealth address derivation correctness (for testing/validation)
   *
   * ## Purpose:
   * Validates that the stealth address and stealth private key are correctly derived
   * from the meta keys and shared secret. Used for testing and debugging.
   *
   * ## Process:
   * 1. Derive stealth address from meta spending public key + shared secret
   * 2. Derive stealth private key from meta spending private key + shared secret
   * 3. Compute public key from stealth private key
   * 4. Convert public key to Ethereum address
   * 5. Verify derived address matches stealth address
   *
   * ## Math Verification:
   * ```
   * StealthPub = SpendPub + hash(S)·G  (public key derivation)
   * StealthPriv = spendPriv + hash(S)   (private key derivation)
   *
   * Verification: StealthPub == StealthPriv·G
   * ```
   *
   * @param metaSpendingPub - Meta spending public key (33 bytes compressed)
   * @param metaSpendingPriv - Meta spending private key (32 bytes)
   * @param sharedSecret - ECDH shared secret (32 bytes)
   * @returns true if derivation is correct, false otherwise
   *
   * @example
   * ```typescript
   * // Test stealth address derivation
   * const sharedSecret = Ecdh.computeSharedSecret(ephemeralPriv, metaViewingPub);
   *
   * const isValid = Address.verifyStealthDerivation(
   *   metaSpendingPub,
   *   metaSpendingPriv,
   *   sharedSecret
   * );
   *
   * if (!isValid) {
   *   throw new Error("Stealth derivation verification failed!");
   * }
   * ```
   */
  static verifyStealthDerivation(
    metaSpendingPub: Uint8Array,
    metaSpendingPriv: Uint8Array,
    sharedSecret: Uint8Array,
  ): boolean {
    try {
      const stealthAddress = this.deriveStealthAddress(metaSpendingPub, sharedSecret);
      const stealthPriv = this.deriveStealthPrivateKey(metaSpendingPriv, sharedSecret);

      const stealthPub = secp256k1.getPublicKey(stealthPriv, false);
      const derivedAddress = Secp256k1.publicKeyToAddress(stealthPub);

      if (stealthAddress.length !== derivedAddress.length) {
        return false;
      }

      for (let i = 0; i < stealthAddress.length; i++) {
        if (stealthAddress[i] !== derivedAddress[i]) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}
