import { Secp256k1 } from '@/lib/crypto/secp256k1';
import { secp256k1 } from '@noble/curves/secp256k1';
import { Bytes } from '@/lib/helpers/bytes';

/**
 * Elliptic Curve Diffie-Hellman (ECDH) for NinjaRupiah
 *
 * Implements ECDH key exchange over secp256k1 curve for deriving shared secrets.
 * Used extensively in stealth address protocol (ERC-5564) for privacy-preserving payments.
 *
 * ## ECDH Protocol:
 * Two parties can derive the same shared secret without revealing their private keys:
 * - Alice has private key `a` and public key `A = a × G`
 * - Bob has private key `b` and public key `B = b × G`
 * - Shared secret: `S = a × B = b × A = (a × b) × G`
 *
 * ## Use Cases in NinjaRupiah:
 *
 * ### Stealth Address Generation (Sender):
 * ```typescript
 * // Sender generates ephemeral keypair
 * const { privateKey: ephemeralPriv, publicKey: ephemeralPub } = Ecdh.generateEphemeralKeypair();
 *
 * // Compute shared secret with recipient's meta viewing key
 * const sharedSecret = Ecdh.computeSharedSecret(ephemeralPriv, recipientMetaViewingPub);
 *
 * // Derive stealth address from shared secret
 * const stealthAddress = Address.generateStealthAddress(
 *   recipientMetaViewingPub,
 *   recipientMetaSpendingPub,
 *   sharedSecret
 * );
 *
 * // Publish ephemeralPub on-chain with payment
 * await contract.announce(ephemeralPub, stealthAddress);
 * ```
 *
 * ### Payment Scanning (Recipient):
 * ```typescript
 * // For each announcement on-chain
 * const announcement = await contract.getAnnouncement(index);
 *
 * // Compute shared secret using recipient's meta viewing private key
 * const sharedSecret = Ecdh.computeSharedSecret(
 *   recipientMetaViewingPriv,
 *   announcement.ephemeralPub
 * );
 *
 * // Check if payment belongs to recipient
 * const belongsToMe = Address.checkStealthAddress(
 *   announcement.stealthAddress,
 *   recipientMetaViewingPub,
 *   recipientMetaSpendingPub,
 *   sharedSecret
 * );
 * ```
 *
 * ## Security:
 * - Uses audited @noble/curves library
 * - Shared secret is 32 bytes (256 bits) for use in key derivation
 * - Returns x-coordinate of shared point (standard ECDH practice)
 * - Ephemeral keys should be used only once per payment
 *
 * @see ERC-5564 Stealth Address Protocol
 * @see https://eips.ethereum.org/EIPS/eip-5564
 */
export class Ecdh {
  /**
   * Compute shared secret using ECDH
   *
   * Derives a shared secret from one party's private key and another party's public key.
   * Both parties can compute the same shared secret independently.
   *
   * ## Algorithm:
   * 1. Validate private and public keys
   * 2. Parse public key as elliptic curve point
   * 3. Multiply public key point by private key scalar: sharedPoint = publicKey × privateKey
   * 4. Extract x-coordinate of shared point as secret (32 bytes)
   *
   * ## Properties:
   * - Commutative: ECDH(a, B) = ECDH(b, A) where B = b×G, A = a×G
   * - Non-reversible: Cannot derive private key from public key or shared secret
   * - Deterministic: Same inputs always produce same output
   *
   * ## Security:
   * - Private key must be kept secret (controls shared secret)
   * - Public key can be shared publicly
   * - Shared secret should be used immediately and then zeroed
   * - Use unique ephemeral keys for each session
   *
   * @param privateKey - 32-byte private key (your secret)
   * @param publicKey - 33-byte compressed public key (other party's public key)
   * @returns 32-byte shared secret
   *
   * @throws Error if private key is invalid
   * @throws Error if public key is invalid
   * @throws Error if ECDH computation fails
   *
   * @example
   * ```typescript
   * // Sender side (generate stealth address)
   * const ephemeralKeypair = Ecdh.generateEphemeralKeypair();
   * const sharedSecret = Ecdh.computeSharedSecret(
   *   ephemeralKeypair.privateKey,
   *   recipientMetaViewingPub
   * );
   *
   * // Recipient side (scan for payments)
   * const sharedSecret = Ecdh.computeSharedSecret(
   *   metaViewingPriv, // Recipient's private key
   *   ephemeralPub      // Sender's ephemeral public key from announcement
   * );
   *
   * // Both secrets are identical
   * console.log(sharedSecret.length); // 32 bytes
   *
   * // Use shared secret for key derivation
   * const stealthPriv = Address.deriveStealthPrivateKey(metaSpendingPriv, sharedSecret);
   *
   * // IMPORTANT: Zero shared secret after use
   * Bytes.zeroBytes(sharedSecret);
   * ```
   */
  static computeSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
    if (!Secp256k1.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key');
    }

    if (!Secp256k1.isValidPublicKey(publicKey)) {
      throw new Error('Invalid public key');
    }

    try {
      const publicPoint = secp256k1.ProjectivePoint.fromHex(publicKey);

      const privateKeyHex = Bytes.bytesToHex(privateKey);
      const sharedPoint = publicPoint.multiply(BigInt('0x' + privateKeyHex));

      const sharedSecret = sharedPoint.toRawBytes(true).slice(1);

      if (sharedSecret.length !== 32) {
        throw new Error('Invalid shared secret length');
      }

      return sharedSecret;
    } catch (error) {
      throw new Error(`ECDH computation failed: ${error}`);
    }
  }

  /**
   * Generate ephemeral keypair for one-time use
   *
   * Creates a random secp256k1 keypair for ephemeral ECDH exchanges.
   * Used by senders to generate stealth addresses without revealing their identity.
   *
   * ## Ephemeral Keys:
   * - Generated fresh for each stealth payment
   * - Private key used to compute shared secret, then discarded
   * - Public key published on-chain with payment announcement
   * - Recipient uses ephemeral public key to derive shared secret
   *
   * ## Security:
   * - Uses cryptographically secure random number generator
   * - Private key should be used once and then zeroed
   * - Never reuse ephemeral keys (breaks unlinkability)
   *
   * ## Stealth Address Flow:
   * 1. Sender generates ephemeral keypair
   * 2. Sender computes shared secret with recipient's meta viewing key
   * 3. Sender derives stealth address and sends payment
   * 4. Sender publishes ephemeral public key on-chain
   * 5. Recipient scans announcements and computes same shared secret
   * 6. Recipient derives stealth private key to claim payment
   *
   * @returns Object with privateKey (32 bytes) and publicKey (33 bytes compressed)
   *
   * @example
   * ```typescript
   * // Generate ephemeral keypair for stealth payment
   * const ephemeral = Ecdh.generateEphemeralKeypair();
   * console.log(ephemeral.privateKey.length); // 32 bytes
   * console.log(ephemeral.publicKey.length);  // 33 bytes (compressed)
   *
   * // Compute shared secret with recipient
   * const sharedSecret = Ecdh.computeSharedSecret(
   *   ephemeral.privateKey,
   *   recipientMetaViewingPub
   * );
   *
   * // Generate stealth address
   * const { stealthAddress, stealthPub } = Address.generateStealthAddress(
   *   recipientMetaViewingPub,
   *   recipientMetaSpendingPub,
   *   sharedSecret
   * );
   *
   * // Send payment and announce
   * await token.transfer(stealthAddress, amount);
   * await contract.announce(ephemeral.publicKey, stealthAddress);
   *
   * // CRITICAL: Zero ephemeral private key after use
   * Bytes.zeroBytes(ephemeral.privateKey);
   * ```
   */
  static generateEphemeralKeypair(): {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  } {
    const privateKey = secp256k1.utils.randomPrivateKey();
    const publicKey = secp256k1.getPublicKey(privateKey, true);

    return { privateKey, publicKey };
  }
}
