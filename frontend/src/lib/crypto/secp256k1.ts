import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3.js';

/**
 * Secp256k1 Elliptic Curve Cryptography for NinjaRupiah
 *
 * ## Purpose:
 * Provides secp256k1 elliptic curve operations for Ethereum-compatible cryptography:
 * - Public key derivation from private keys
 * - Compressed public key format (33 bytes)
 * - Stealth address key generation
 * - Ethereum wallet compatibility
 *
 * ## Secp256k1 Curve:
 * - Used by Bitcoin and Ethereum
 * - 256-bit elliptic curve
 * - Public keys can be compressed (33 bytes) or uncompressed (65 bytes)
 * - NinjaRupiah uses compressed format for efficiency
 *
 * ## Key Format:
 * - **Private Key**: 32 bytes (256 bits) - MUST be kept secret
 * - **Public Key (compressed)**: 33 bytes - Safe to share
 *   - Format: [0x02 or 0x03] + [32-byte x-coordinate]
 *   - Prefix 0x02: y-coordinate is even
 *   - Prefix 0x03: y-coordinate is odd
 *
 * ## Usage in NinjaRupiah:
 * ```typescript
 * // Derive public keys from meta viewing/spending private keys
 * const metaViewingPriv = Kdf.deriveMetaViewingKey(masterKey);
 * const metaViewingPub = Secp256k1.privateKeyToPublicKey(metaViewingPriv);
 *
 * const metaSpendingPriv = Kdf.deriveMetaSpendingKey(masterKey);
 * const metaSpendingPub = Secp256k1.privateKeyToPublicKey(metaSpendingPriv);
 *
 * // Register public keys on-chain with username
 * await contract.registerUsername(username, metaViewingPub, metaSpendingPub);
 * ```
 *
 * ## Security:
 * - Private keys must be 32 bytes of cryptographically secure random data
 * - Never expose private keys (they control funds)
 * - Public keys are safe to share (cannot derive private key from public key)
 * - Uses @noble/curves library (audited, battle-tested implementation)
 */
export class Secp256k1 {
  /**
   * Derive compressed public key from private key
   *
   * ## Process:
   * 1. Validates private key is exactly 32 bytes
   * 2. Computes elliptic curve point multiplication: publicKey = privateKey × G
   * 3. Returns compressed format (33 bytes)
   *
   * ## Compressed Format:
   * - Byte 0: 0x02 (even y) or 0x03 (odd y)
   * - Bytes 1-32: x-coordinate of the public key point
   *
   * ## Use Cases:
   * - Derive meta viewing public key from meta viewing private key
   * - Derive meta spending public key from meta spending private key
   * - Generate stealth address public keys
   * - Create Ethereum-compatible addresses
   *
   * @param privateKey - 32-byte private key (ECDSA scalar)
   * @returns 33-byte compressed public key
   *
   * @throws Error if private key is not 32 bytes
   * @throws Error if private key is invalid (not on curve, zero, or >= curve order)
   *
   * @example
   * ```typescript
   * // Derive viewing key pair
   * const viewingPriv = Kdf.deriveMetaViewingKey(masterKey);
   * const viewingPub = Secp256k1.privateKeyToPublicKey(viewingPriv);
   * console.log(viewingPub.length); // 33 bytes
   * console.log(viewingPub[0]); // 0x02 or 0x03
   *
   * // Derive spending key pair
   * const spendingPriv = Kdf.deriveMetaSpendingKey(masterKey);
   * const spendingPub = Secp256k1.privateKeyToPublicKey(spendingPriv);
   *
   * // Register on-chain
   * await contract.registerUsername("alice", viewingPub, spendingPub);
   * ```
   */
  static privateKeyToPublicKey(privateKey: Uint8Array): Uint8Array {
    if (privateKey.length !== 32) {
      throw new Error('Private key must be 32 bytes');
    }

    try {
      const publicKey = secp256k1.getPublicKey(privateKey, true);
      return publicKey;
    } catch (error) {
      throw new Error(`Invalid private key: ${error}`);
    }
  }

  /**
   * Validate private key format and value
   *
   * Checks if a byte array is a valid secp256k1 private key.
   * A valid private key must be:
   * - Exactly 32 bytes long
   * - Within the valid range (0 < key < curve order)
   * - Able to generate a valid public key
   *
   * ## Use Cases:
   * - Pre-validation before cryptographic operations
   * - Input validation for key import
   * - Sanity checks before signing or key derivation
   *
   * @param privateKey - Byte array to validate
   * @returns true if valid private key, false otherwise
   *
   * @example
   * ```typescript
   * // Validate before use
   * const privateKey = Kdf.deriveMetaViewingKey(masterKey);
   * if (!Secp256k1.isValidPrivateKey(privateKey)) {
   *   throw new Error("Invalid private key derived");
   * }
   *
   * // Validate user input
   * const importedKey = Bytes.hexToBytes(userInput);
   * if (!Secp256k1.isValidPrivateKey(importedKey)) {
   *   console.error("Invalid private key format");
   *   return;
   * }
   *
   * // Safe to use after validation
   * const publicKey = Secp256k1.privateKeyToPublicKey(privateKey);
   * ```
   */
  static isValidPrivateKey(privateKey: Uint8Array): boolean {
    if (privateKey.length !== 32) {
      return false;
    }

    try {
      secp256k1.getPublicKey(privateKey, true);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate public key format and point
   *
   * Checks if a byte array is a valid secp256k1 public key.
   * Supports both compressed (33 bytes) and uncompressed (65 bytes) formats.
   *
   * ## Valid Formats:
   * - **Compressed** (33 bytes): [0x02 or 0x03] + [32-byte x-coordinate]
   * - **Uncompressed** (65 bytes): [0x04] + [32-byte x] + [32-byte y]
   *
   * ## Validation:
   * - Checks length is 33 or 65 bytes
   * - Verifies prefix byte (0x02, 0x03, or 0x04)
   * - Ensures point lies on the secp256k1 curve
   *
   * @param publicKey - Byte array to validate
   * @returns true if valid public key, false otherwise
   *
   * @example
   * ```typescript
   * // Validate before ECDH
   * const metaViewingPub = await loadPublicKey(username);
   * if (!Secp256k1.isValidPublicKey(metaViewingPub)) {
   *   throw new Error("Invalid public key for user");
   * }
   *
   * // Validate compressed format
   * const compressedKey = new Uint8Array(33);
   * compressedKey[0] = 0x02;
   * console.log(Secp256k1.isValidPublicKey(compressedKey)); // false (invalid point)
   *
   * // Validate uncompressed format
   * const uncompressedKey = new Uint8Array(65);
   * uncompressedKey[0] = 0x04;
   * console.log(Secp256k1.isValidPublicKey(uncompressedKey)); // false (invalid point)
   * ```
   */
  static isValidPublicKey(publicKey: Uint8Array): boolean {
    if (publicKey.length !== 33 && publicKey.length !== 65) {
      return false;
    }

    try {
      secp256k1.ProjectivePoint.fromHex(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Derive Ethereum address from public key
   *
   * Converts a secp256k1 public key to an Ethereum address using Keccak256 hashing.
   * Supports both compressed and uncompressed public key formats.
   *
   * ## Algorithm (Ethereum Address Derivation):
   * 1. If compressed (33 bytes), decompress to uncompressed format (65 bytes)
   * 2. Take uncompressed public key without prefix: [x (32 bytes)][y (32 bytes)]
   * 3. Hash with Keccak256: hash = keccak256(x || y)
   * 4. Take last 20 bytes of hash as address
   *
   * ## Format:
   * - Input: 33-byte compressed or 65-byte uncompressed public key
   * - Output: 20-byte Ethereum address (without 0x prefix)
   *
   * ## Use Cases:
   * - Generate stealth addresses for payments
   * - Derive Ethereum address from meta keys
   * - Convert public keys to addresses for on-chain lookups
   *
   * @param publicKey - Compressed (33 bytes) or uncompressed (65 bytes) public key
   * @returns 20-byte Ethereum address
   *
   * @throws Error if public key is invalid
   *
   * @example
   * ```typescript
   * // Derive address from meta viewing key
   * const metaViewingPriv = Kdf.deriveMetaViewingKey(masterKey);
   * const metaViewingPub = Secp256k1.privateKeyToPublicKey(metaViewingPriv);
   * const address = Secp256k1.publicKeyToAddress(metaViewingPub);
   * console.log(address.length); // 20 bytes
   *
   * // Convert to checksummed string
   * const addressHex = Bytes.bytesToHex(address);
   * const checksummed = Encoding.toChecksumAddress(addressHex);
   * console.log(checksummed); // "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
   *
   * // Generate stealth address
   * const stealthPub = Address.generateStealthPublicKey(metaViewingPub, metaSpendingPub, ephemeralPriv);
   * const stealthAddress = Secp256k1.publicKeyToAddress(stealthPub);
   * ```
   */
  static publicKeyToAddress(publicKey: Uint8Array): Uint8Array {
    if (!this.isValidPublicKey(publicKey)) {
      throw new Error('Invalid public key');
    }

    let uncompressed: Uint8Array;

    if (publicKey.length === 33) {
      const point = secp256k1.ProjectivePoint.fromHex(publicKey);

      uncompressed = point.toRawBytes(false);
    } else {
      uncompressed = publicKey;
    }

    const hash = keccak_256(uncompressed.slice(1));

    return hash.slice(12, 32);
  }
}
