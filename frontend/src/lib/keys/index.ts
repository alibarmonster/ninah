/**
 * Key Management Module for NinjaRupiah
 *
 * Provides complete cryptographic key lifecycle management:
 * - **Two-factor key derivation** (password + Privy wallet)
 * - **Encrypted IndexedDB storage** with AAD binding
 * - **Memory-safe key handling** with automatic zeroing
 * - **Session management** (initialize, unlock, lock)
 *
 * ## Quick Start:
 *
 * ```typescript
 * import { keyManager } from '@/lib/keys';
 *
 * // First-time setup
 * await keyManager.initialize({
 *   password: "SecurePass123!",
 *   wallet: privyWallet,
 *   userIdentifier: user.email.address,
 *   authMethod: 'email'
 * });
 *
 * // Later sessions
 * await keyManager.unlock({
 *   password: "SecurePass123!",
 *   wallet: privyWallet,
 *   userIdentifier: user.email.address
 * });
 *
 * // Use keys
 * const keys = keyManager.getKeys();
 * const publicKeys = keyManager.getPublicKeys();
 *
 * // Lock when done
 * keyManager.lock();
 * ```
 *
 * ## Exports:
 *
 * ### Classes:
 * - `KeyManager` - Main key management class
 * - `keyManager` - Singleton instance (recommended)
 * - `Derivation` - Low-level key derivation utilities
 * - `Storage` - Encrypted storage utilities
 *
 * ### Types:
 * - `DerivedKeys` - Complete key set (master, storage, viewing, spending)
 * - `PublicKeys` - Public keys only (for on-chain registration)
 * - `AuthMethod` - Privy authentication methods
 * - `EncryptedKeyStorage` - IndexedDB storage format
 * - `KeyInitParams` - Initialization parameters
 * - `KeyUnlockParams` - Unlock parameters
 * - `KeyManagerState` - Manager state
 *
 * @module keys
 */

// KeyManager (singleton and class)
export { KeyManager, keyManager } from '@/lib/keys/manager';

// Key derivation utilities
export { Derivation } from '@/lib/keys/derivation';

// Storage utilities
export { Storage } from '@/lib/keys/storage';

// Types
export type {
  DerivedKeys,
  PublicKeys,
  AuthMethod,
  EncryptedKeyStorage,
  KeyInitParams,
  KeyUnlockParams,
  KeyManagerState,
} from '@/lib/keys/types';
