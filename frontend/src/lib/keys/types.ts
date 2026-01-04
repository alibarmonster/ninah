/**
 * Application keys derived from master key using HKDF-Keccak256
 *
 * ## Security:
 * - Master key should NEVER be stored persistently
 * - Only used ephemerally during key derivation
 * - All private keys must be zeroed from memory when no longer needed
 *
 * ## Key Hierarchy:
 * ```
 * Master Key (32 bytes)
 * ├─ Storage Encryption Key (32 bytes) - For encrypting local data
 * ├─ Meta Viewing Private Key (32 bytes) - For scanning stealth payments
 * ├─ Meta Viewing Public Key (33 bytes) - Shared for receiving payments
 * ├─ Meta Spending Private Key (32 bytes) - For spending funds
 * └─ Meta Spending Public Key (33 bytes) - Registered on-chain
 * ```
 */
export interface DerivedKeys {
  /** Master key (32 bytes) - NEVER store persistently, only use ephemerally */
  masterKey: Uint8Array;
  /** Storage encryption key (32 bytes) - For AES-256-GCM encryption of local data */
  storageEncryptionKey: Uint8Array;
  /** Meta viewing private key (32 bytes) - For scanning incoming stealth payments */
  metaViewingPriv: Uint8Array;
  /** Meta viewing public key (33 bytes compressed) - Shared with senders for payment discovery */
  metaViewingPub: Uint8Array;
  /** Meta spending private key (32 bytes) - For signing transactions and spending funds */
  metaSpendingPriv: Uint8Array;
  /** Meta spending public key (33 bytes compressed) - Registered on-chain with username */
  metaSpendingPub: Uint8Array;
}

/**
 * Public keys for on-chain username registration
 *
 * These keys are safe to expose publicly and are registered
 * on the NinjaRupiah smart contract along with the username.
 *
 * ## Usage:
 * - Senders use these keys to generate stealth addresses
 * - Recipients use corresponding private keys to detect and spend payments
 *
 * @see {@link DerivedKeys} for the full key set including private keys
 */
export interface PublicKeys {
  /** Meta viewing public key (33 bytes compressed) - For payment discovery */
  metaViewingPub: Uint8Array;
  /** Meta spending public key (33 bytes compressed) - For on-chain registration */
  metaSpendingPub: Uint8Array;
}

/**
 * Privy authentication methods supported by NinjaRupiah
 *
 * Each method provides a different way for users to authenticate:
 * - `email` - Email OTP authentication
 * - `twitter` - Twitter OAuth
 * - `discord` - Discord OAuth
 * - `phone` - SMS OTP authentication
 * - `wallet` - External wallet connection (MetaMask, WalletConnect, etc.)
 * - `farcaster` - Farcaster social login
 * - `telegram` - Telegram authentication
 *
 * The auth method determines which identifier is used for key derivation.
 */
export type AuthMethod = 'email' | 'twitter' | 'discord' | 'phone' | 'wallet' | 'farcaster' | 'telegram';

/**
 * Encrypted key storage format for IndexedDB persistence
 *
 * ## Security Features:
 * - AAD (Additional Authenticated Data) binding to wallet address prevents key swapping
 * - Argon2id password hashing with user-specific salt
 * - AES-256-GCM authenticated encryption
 * - Version field enables future migration
 *
 * ## Storage Location:
 * - Stored in IndexedDB under `NinjaRupiah` database
 * - Object store: `keys`
 * - Key: `walletAddress`
 *
 * @see {@link Storage.encryptKeys} for encryption implementation
 * @see {@link Storage.decryptKeys} for decryption implementation
 */
export interface EncryptedKeyStorage {
  /** App version for future migration support */
  version: string;
  /** Ethereum wallet address (checksummed) - Used as AAD binding and storage key */
  walletAddress: string;
  /** User identifier from Privy auth (email, Twitter handle, Discord username, phone, wallet address, etc.) */
  userIdentifier: string;
  /** Privy authentication method used during initialization */
  authMethod: AuthMethod;
  /** Base64-encoded Argon2id salt (16-32 bytes) for master key derivation (password + wallet sig) */
  salt: string;
  /** Base64-encoded Argon2id salt (16-32 bytes) for unlock key derivation (password only) */
  unlockSalt: string;
  /** Base64-encoded encrypted keys - Format: [version(1) | nonce(12) | tag(16) | ciphertext(194)] */
  encryptedKeys: string;
  /** Unix timestamp (ms) of when keys were first created */
  createdAt: number;
  /** Unix timestamp (ms) of last update (e.g., password change) */
  updatedAt: number;
}

/**
 * Parameters required for first-time key initialization
 *
 * ## Two-Factor Key Derivation:
 * 1. **Password** (something you know) - Hashed with Argon2id
 * 2. **Wallet signature** (something you have) - Deterministic signature from Privy wallet
 *
 * Combined using HKDF-Keccak256 to derive master key.
 *
 * @example
 * ```typescript
 * await keyManager.initialize({
 *   password: "MySecurePassword123!",
 *   wallet: privyWallet,
 *   userIdentifier: user.email.address,
 *   authMethod: 'email'
 * });
 * ```
 *
 * @see {@link KeyManager.initialize}
 */
export interface KeyInitParams {
  /** User-provided password (min 8 chars, will be hashed with Argon2id) */
  password: string;
  /** Privy wallet instance with address and signing capability */
  wallet: {
    /** Ethereum wallet address (will be checksummed) */
    address: string;
    /** Function to sign messages deterministically for key derivation */
    signMessage: (message: string) => Promise<string>;
  };
  /** User identifier from Privy auth (email, Twitter handle, phone, wallet address, etc.) */
  userIdentifier: string;
  /** Privy authentication method being used */
  authMethod: AuthMethod;
}

/**
 * Parameters required for unlocking existing keys
 *
 * ## Process:
 * 1. Load encrypted keys from IndexedDB using wallet address
 * 2. Derive unlock key from password only (no wallet signature needed)
 * 3. Decrypt stored keys using unlock key
 * 4. Validate decrypted keys
 *
 * ## Security:
 * - Password-only unlock for better UX (no wallet popup)
 * - Wallet signature was used during initialization (for key entropy)
 * - Failed attempts automatically lock the manager
 *
 * @example
 * ```typescript
 * await keyManager.unlock({
 *   password: "MySecurePassword123!",
 *   walletAddress: "0x..."
 * });
 * ```
 *
 * @see {@link KeyManager.unlock}
 */
export interface KeyUnlockParams {
  /** User password - Must match the password used during initialization */
  password: string;
  /** Ethereum wallet address - Used to look up stored keys in IndexedDB */
  walletAddress: string;
}

/**
 * Internal state of the KeyManager
 *
 * ## State Transitions:
 * ```
 * Uninitialized → Initialize → Initialized + Unlocked
 *                              ↓
 *                            Lock → Locked
 *                              ↓
 *                           Unlock → Unlocked
 * ```
 *
 * ## Security:
 * - Keys are null when locked (zeroed from memory)
 * - Wallet address persists across lock/unlock for UI state
 * - State is read-only via getState() method
 *
 * @see {@link KeyManager.getState}
 */
export interface KeyManagerState {
  /** True if keys exist in IndexedDB for this manager instance */
  isInitialized: boolean;
  /** True if keys are currently loaded and accessible in memory */
  isUnlocked: boolean;
  /** Ethereum wallet address (null if never initialized) */
  walletAddress: string | null;
  /** User identifier from Privy auth (null if never initialized) */
  userIdentifier: string | null;
  /** Privy authentication method (null if never initialized) */
  authMethod: AuthMethod | null;
  /** Decrypted keys in memory (null when locked) */
  keys: DerivedKeys | null;
}

export interface WalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}
