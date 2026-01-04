/**
 * Cryptographically Secure Random Number Generation
 *
 * ## Purpose:
 * Provides cryptographically secure random bytes for:
 * - Nonces (number used once) for AES-GCM encryption
 * - Salts for key derivation functions (Argon2, HKDF)
 * - Secrets and cryptographic keys
 *
 * ## Security:
 * - Uses Web Crypto API `crypto.getRandomValues()`
 * - Cryptographically secure pseudo-random number generator (CSPRNG)
 * - Suitable for security-critical applications
 * - Browser-native implementation (no external dependencies)
 *
 * ## Usage:
 * ```typescript
 * // Generate 12-byte nonce for AES-GCM
 * const nonce = Nonce.generateNonce(12);
 *
 * // Generate 16-byte salt for Argon2
 * const salt = Nonce.generateSalt(16);
 *
 * // Generate 32-byte secret key
 * const secret = Nonce.generateSecret();
 * ```
 */
export class Nonce {
  /**
   * Generate cryptographically secure random bytes
   *
   * ## Security Properties:
   * - Uses `crypto.getRandomValues()` (CSPRNG)
   * - Suitable for nonces, IVs, and cryptographic keys
   * - Maximum entropy for given length
   *
   * ## Common Lengths:
   * - 12 bytes: AES-GCM nonce (recommended)
   * - 16 bytes: AES-CBC IV, Argon2 salt
   * - 32 bytes: Secret keys, symmetric keys
   *
   * @param length - Number of random bytes to generate (1-32 bytes)
   * @returns Cryptographically secure random bytes
   *
   * @throws Error if crypto.getRandomValues is unavailable
   * @throws Error if length is not between 1 and 32 bytes
   *
   * @example
   * ```typescript
   * // Generate 12-byte nonce for AES-GCM encryption
   * const nonce = Nonce.generateNonce(12);
   *
   * // Generate 16-byte salt for KDF
   * const salt = Nonce.generateNonce(16);
   * ```
   */
  static generateNonce(length: number = 12): Uint8Array {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
      throw new Error('crypto.getRandomValues is not available');
    }

    if (length <= 0 || length > 32) {
      throw new Error('Nonce length must be between 1 and 32 bytes');
    }

    const nonce = new Uint8Array(length);
    crypto.getRandomValues(nonce);
    return nonce;
  }

  /**
   * Generate 32-byte cryptographic secret
   *
   * Convenience method for generating full-length (256-bit) secrets.
   * Suitable for:
   * - Symmetric encryption keys (AES-256)
   * - HMAC keys
   * - Master secrets
   *
   * @returns 32 bytes of cryptographically secure random data
   *
   * @example
   * ```typescript
   * // Generate AES-256 key
   * const key = Nonce.generateSecret();
   * ```
   */
  static generateSecret(): Uint8Array {
    return this.generateNonce(32);
  }

  /**
   * Generate cryptographically secure salt for key derivation
   *
   * Salts are used in key derivation functions (KDFs) like Argon2 and HKDF
   * to ensure unique derived keys even with identical passwords.
   *
   * ## Recommended Lengths:
   * - 16 bytes: Minimum for Argon2 (default)
   * - 32 bytes: Recommended for maximum security
   *
   * @param length - Salt length in bytes (default: 16, recommended: 16-32)
   * @returns Cryptographically secure random salt
   *
   * @example
   * ```typescript
   * // Generate 16-byte salt for Argon2
   * const salt = Nonce.generateSalt(16);
   *
   * // Generate 32-byte salt for HKDF
   * const hkdfSalt = Nonce.generateSalt(32);
   * ```
   */
  static generateSalt(length: number = 16): Uint8Array {
    return this.generateNonce(length);
  }
}
