/**
 * Application Constants for Mock NinjaRupiah
 *
 * Centralized configuration constants for the mock version.
 * All proof generation is done locally - no backend needed.
 */

export const APP_VERSION = 'v1-mock';

export const KEY_DERIVATION_VERSION = 'v1';

export const SIGNATURE_MESSAGE_TEMPLATE = 'NinjaRupiah-v1-key-derivation';

export const MAX_USERNAME_LENGTH = 32;
export const MIN_USERNAME_LENGTH = 1;

export const USERNAME_REGEX = /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/;
export const ALLOWED_USERNAME_CHARS = /^[a-z0-9._-]/;

export const PASSWORD_REQUIREMENT = {
  minLength: 12,
  requireUpperCase: true,
  requireLowerCase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

export const ARGON2_CONFIG = {
  memoryCost: 65534,
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
};

export const STORAGE_KEYS = {
  ENCRYPTED_KEYS: 'encrypted_keys',
  USER_PROFILE: 'user_profile',
  PAYMENTS: 'user_payments',
  SETTINGS: 'user_settings',
};

export const KEY_SIZES = {
  PRIVATE_KEY: 32,
  PUBLIC_KEY_COMPRESSED: 33,
  PUBLIC_KEY_UNCOMPRESSED: 65,
  ADDRESS: 20,
  HASH: 32,
  NONCE: 12,
  TAG: 16,
  SALT: 16,
};

export const NETWORKS = {
  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
  },
};

/**
 * Contract addresses - UPDATE THESE after deploying mock contracts
 */
export const CONTRACT_ADDRESSES = {
  [NETWORKS.BASE_SEPOLIA.chainId]: {
    NINJA_RUPIAH: '0x', // Update after deployment
    IDRX_MOCK: '0x', // Update after deployment
    SP1_VERIFIER: '0x', // MockSP1Verifier address - Update after deployment
  },
};

/**
 * Proof endpoints - NOT USED in mock version
 * All proof generation happens locally in proof.ts
 */
export const PROOF_ENDPOINTS = {
  USERNAME_PROOF: '/api/proof/username',
  CLAIMING_PROOF: '/api/proof/claiming',
};

export const SCANNER_CONFIG = {
  POLL_INTERVAL_MS: 10000,
  BLOCKS_PER_SCAN: 1000,
  MAX_RETRIES: 3,
};

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const ERROR_MESSAGES = {
  INVALID_PASSWORD: 'Invalid password',
  WALLET_NOT_CONNECTED: 'Wallet not connected',
  KEYS_NOT_INITIALIZED: 'Keys not initialized',
  KEYS_LOCKED: 'Keys are locked',
  USERNAME_TAKEN: 'Username already taken',
  INVALID_USERNAME: 'Invalid username format',
  INVALID_ADDRESS: 'Invalid Ethereum address',
  PROOF_GENERATION_FAILED: 'Failed to generate Proofs',
  TRANSACTION_FAILED: 'Transaction failed',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  PAYMENT_NOT_FOUND: 'Payment not found',
  ALREADY_CLAIMED: 'Payment already claimed',
};
