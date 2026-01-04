/**
 * Cryptographic Utilities Module for NinjaRupiah
 *
 * ## Overview:
 * Provides battle-tested cryptographic primitives for privacy-preserving payments:
 * - **AES-256-GCM Encryption**: Authenticated encryption for data at rest
 * - **Argon2id + HKDF**: Password-based key derivation with wallet binding
 * - **Secp256k1**: Ethereum-compatible elliptic curve cryptography
 * - **CSPRNG**: Cryptographically secure random number generation
 *
 * ## Quick Start:
 *
 * ```typescript
 * import { Encryption, Kdf, Nonce, Secp256k1 } from '@/lib/crypto';
 *
 * // 1. Generate salt and derive password hash
 * const salt = Kdf.generateArgon2Salt(16);
 * const passwordHash = await Kdf.derivePasswordHash(password, salt);
 *
 * // 2. Get wallet signature
 * const walletSig = await Kdf.deriveWalletSignature(privyWallet, userEmail);
 *
 * // 3. Derive master key (combines password + wallet)
 * const masterKey = Kdf.deriveMasterKey(passwordHash, walletSig);
 *
 * // 4. Derive purpose-specific keys
 * const storageKey = Kdf.deriveStorageEncryptionKey(masterKey);
 * const viewingPriv = Kdf.deriveMetaViewingKey(masterKey);
 * const spendingPriv = Kdf.deriveMetaSpendingKey(masterKey);
 *
 * // 5. Generate public keys
 * const viewingPub = Secp256k1.privateKeyToPublicKey(viewingPriv);
 * const spendingPub = Secp256k1.privateKeyToPublicKey(spendingPriv);
 *
 * // 6. Encrypt sensitive data
 * const encrypted = await Encryption.encryptJson(
 *   { privateKey: viewingPriv },
 *   storageKey
 * );
 * ```
 *
 * ## Architecture:
 *
 * ### Two-Factor Key Derivation:
 * ```
 * Password → Argon2id → Hash (32 bytes)
 *                           ↓
 * Wallet → signMessage → Signature (65 bytes)
 *                           ↓
 *                    HKDF-Keccak256
 *                           ↓
 *                   Master Key (32 bytes)
 *                           ↓
 *        ┌──────────────────┴──────────────────┐
 *        ↓                  ↓                   ↓
 *  Storage Key      Viewing Key         Spending Key
 *   (AES-256)       (secp256k1)         (secp256k1)
 * ```
 *
 * ### Security Properties:
 * - **Password alone is not enough**: Requires Privy wallet access
 * - **Wallet alone is not enough**: Requires password
 * - **Deterministic**: Same inputs → same keys (enables key recovery)
 * - **Privacy-first**: All derivation happens client-side
 * - **Post-quantum resistant password hashing**: Argon2id (memory-hard)
 *
 * ## Exports:
 *
 * ### Classes:
 * - `Encryption` - AES-256-GCM encryption/decryption with AAD support
 * - `Kdf` - Key derivation functions (Argon2id, HKDF-Keccak256)
 * - `Nonce` - Cryptographically secure random number generation
 * - `Secp256k1` - Elliptic curve operations for Ethereum compatibility
 *
 * ### Types:
 * - `EncryptedData` - Structure for encrypted data with nonce and tag
 * - `SerializedEncryption` - Base64-encoded encrypted data format
 * - `Argon2Config` - Configuration for Argon2id password hashing
 *
 * ### Constants:
 * - `DEFAULT_ARGON2_CONFIG` - Recommended Argon2id parameters (64MB, 3 iterations)
 *
 * @module crypto
 */

// Encryption utilities (AES-256-GCM)
export { Encryption } from '@/lib/crypto/encryption';
export type { EncryptedData, SerializedEncryption } from '@/lib/crypto/encryption';

// Key Derivation Functions (Argon2id, HKDF-Keccak256)
export { Kdf, DEFAULT_ARGON2_CONFIG } from '@/lib/crypto/kdf';
export type { Argon2Config } from '@/lib/crypto/kdf';

// Cryptographically Secure Random Number Generation
export { Nonce } from '@/lib/crypto/nonce';

// Secp256k1 Elliptic Curve Cryptography
export { Secp256k1 } from '@/lib/crypto/secp256k1';
