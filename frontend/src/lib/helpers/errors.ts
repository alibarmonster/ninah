/**
 * Error Handling for NinjaRupiah
 *
 * Comprehensive error hierarchy for type-safe error handling across the application.
 * Provides specialized error classes for different domains, standardized error codes,
 * and utility functions for error checking and formatting.
 *
 * ## Error Hierarchy:
 * - **NinjaRupiahError**: Base error class for all application errors
 * - **AuthError**: Authentication and authorization failures
 * - **KeyError**: Key management and derivation errors
 * - **UsernameError**: Username validation and registration errors
 * - **CryptoError**: Cryptographic operation failures
 * - **StorageError**: IndexedDB and storage errors
 * - **ContractError**: Smart contract interaction errors
 * - **PaymentError**: Stealth payment processing errors
 * - **ProofError**: Zero-knowledge proof errors
 * - **ValidationError**: Input validation failures
 * - **NetworkError**: Network and RPC errors
 *
 * ## Features:
 * - Type-safe error handling with TypeScript
 * - Standardized error codes for i18n and error tracking
 * - Type guard functions for error type checking
 * - Error message formatting utilities
 *
 * ## Usage Pattern:
 * All errors include:
 * - `message`: Human-readable error description
 * - `code`: Optional standardized error code from ERROR_CODES
 * - `name`: Error class name for debugging
 *
 * @example
 * ```typescript
 * // Throw typed error with code
 * throw new AuthError("Invalid password", ERROR_CODES.AUTH_INVALID_PASSWORD);
 *
 * // Catch and handle specific error types
 * try {
 *   await KeyManager.unlock(password);
 * } catch (error) {
 *   if (isKeyError(error)) {
 *     console.error("Key error:", error.message);
 *   } else if (isAuthError(error)) {
 *     console.error("Auth error:", error.message);
 *   }
 * }
 *
 * // Format any error for display
 * const message = formatError(error);
 * toast.error(message);
 * ```
 */

/**
 * Base error class for all NinjaRupiah errors
 *
 * Parent class for all application-specific errors.
 * Extends standard Error with optional error code field.
 *
 * ## Use Cases:
 * - Distinguish application errors from third-party errors
 * - Attach standardized error codes for tracking
 * - Provide consistent error structure
 *
 * @example
 * ```typescript
 * // Direct usage (prefer specific error classes)
 * throw new NinjaRupiahError("Something went wrong", "GENERIC_ERROR");
 *
 * // Catch all application errors
 * try {
 *   await someOperation();
 * } catch (error) {
 *   if (error instanceof NinjaRupiahError) {
 *     console.error("App error:", error.code, error.message);
 *   }
 * }
 * ```
 */
export class NinjaRupiahError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NinjaRupiahError';
  }
}

/**
 * Authentication and authorization error
 *
 * Thrown when authentication or authorization operations fail.
 *
 * ## Common Causes:
 * - Incorrect password during unlock
 * - Wallet not connected when required
 * - Invalid signature from wallet
 * - Session expired or invalid
 *
 * ## Error Codes:
 * - AUTH_INVALID_PASSWORD
 * - AUTH_WALLET_NOT_CONNECTED
 * - AUTH_SIGNATURE_WALLET
 *
 * @example
 * ```typescript
 * // Password validation failure
 * throw new AuthError("Incorrect password", ERROR_CODES.AUTH_INVALID_PASSWORD);
 *
 * // Wallet connection required
 * if (!wallet.isConnected()) {
 *   throw new AuthError("Please connect your wallet", ERROR_CODES.AUTH_WALLET_NOT_CONNECTED);
 * }
 * ```
 */
export class AuthError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'AuthError';
  }
}

/**
 * Key management and derivation error
 *
 * Thrown when key operations fail (derivation, storage, retrieval).
 *
 * ## Common Causes:
 * - KeyManager not initialized
 * - Keys locked (need unlock)
 * - Invalid key format or length
 * - Key derivation failure
 * - Attempting to create keys that already exist
 *
 * ## Error Codes:
 * - KEY_NOT_INITIALIZED
 * - KEY_LOCKED
 * - KEY_INVALID
 * - KEY_DERIVATION_FAILED
 * - KEY_ALREADY_EXISTS
 *
 * @example
 * ```typescript
 * // Keys not initialized
 * if (!this.keys) {
 *   throw new KeyError("Keys not initialized", ERROR_CODES.KEY_NOT_INITIALIZED);
 * }
 *
 * // Derivation failure
 * try {
 *   const keys = await Kdf.deriveKeys(password, salt);
 * } catch (error) {
 *   throw new KeyError("Failed to derive keys", ERROR_CODES.KEY_DERIVATION_FAILED);
 * }
 * ```
 */
export class KeyError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'KeyError';
  }
}

/**
 * Username validation and registration error
 *
 * Thrown when username operations fail (validation, registration, lookup).
 *
 * ## Common Causes:
 * - Invalid username format
 * - Username too long or too short
 * - Username already taken
 * - Invalid characters in username
 * - Profanity or reserved word used
 *
 * ## Error Codes:
 * - USERNAME_INVALID_FORMAT
 * - USERNAME_TOO_LONG
 * - USERNAME_TOO_SHORT
 * - USERNAME_TAKEN
 * - USERNAME_INVALID_CHARS
 *
 * @example
 * ```typescript
 * // Format validation
 * if (!isValid(username)) {
 *   throw new UsernameError("Invalid username format", ERROR_CODES.USERNAME_INVALID_FORMAT);
 * }
 *
 * // Already taken
 * if (await registry.exists(username)) {
 *   throw new UsernameError("Username already taken", ERROR_CODES.USERNAME_TAKEN);
 * }
 * ```
 */
export class UsernameError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'UsernameError';
  }
}

/**
 * Cryptographic operation error
 *
 * Thrown when cryptographic operations fail (encryption, decryption, hashing).
 *
 * ## Common Causes:
 * - Encryption failure (invalid key, data corruption)
 * - Decryption failure (wrong key, tampered data)
 * - Invalid key format or length
 * - Algorithm not supported
 *
 * ## Error Codes:
 * - CRYPTO_ENCRYPTION_FAILED
 * - CRYPTO_DECRYPTION_FAILED
 * - CRYPTO_INVALID_KEY
 *
 * @example
 * ```typescript
 * // Encryption failure
 * try {
 *   const encrypted = await Encryption.encrypt(data, key);
 * } catch (error) {
 *   throw new CryptoError("Encryption failed", ERROR_CODES.CRYPTO_ENCRYPTION_FAILED);
 * }
 *
 * // Decryption failure (wrong key or corrupted data)
 * try {
 *   const decrypted = await Encryption.decrypt(encrypted, key);
 * } catch (error) {
 *   throw new CryptoError("Decryption failed - invalid key or corrupted data", ERROR_CODES.CRYPTO_DECRYPTION_FAILED);
 * }
 * ```
 */
export class CryptoError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'CryptoError';
  }
}

/**
 * Storage operation error
 *
 * Thrown when IndexedDB or storage operations fail.
 *
 * ## Common Causes:
 * - Failed to read from storage
 * - Failed to write to storage
 * - Data not found in storage
 * - Storage quota exceeded
 * - IndexedDB unavailable
 *
 * ## Error Codes:
 * - STORAGE_READ_FAILED
 * - STORAGE_WRITE_FAILED
 * - STORAGE_NOT_FOUND
 *
 * @example
 * ```typescript
 * // Read failure
 * const data = await db.get('keys');
 * if (!data) {
 *   throw new StorageError("Keys not found in storage", ERROR_CODES.STORAGE_NOT_FOUND);
 * }
 *
 * // Write failure
 * try {
 *   await db.put('keys', encryptedKeys);
 * } catch (error) {
 *   throw new StorageError("Failed to save keys", ERROR_CODES.STORAGE_WRITE_FAILED);
 * }
 * ```
 */
export class StorageError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'StorageError';
  }
}

/**
 * Smart contract interaction error
 *
 * Thrown when blockchain contract operations fail.
 *
 * ## Common Causes:
 * - Contract call failed (revert, out of gas)
 * - Transaction failed (rejected, timeout)
 * - Invalid proof submitted
 * - Contract not deployed
 * - Wrong network
 *
 * ## Error Codes:
 * - CONTRACT_CALL_FAILED
 * - CONTRACT_TX_FAILED
 * - CONTRACT_INVALID_PROOF
 *
 * @example
 * ```typescript
 * // Transaction failure
 * try {
 *   const tx = await contract.registerUsername(username, commitment);
 *   await tx.wait();
 * } catch (error) {
 *   throw new ContractError("Failed to register username", ERROR_CODES.CONTRACT_TX_FAILED);
 * }
 *
 * // Invalid proof
 * if (!isValidProof(proof)) {
 *   throw new ContractError("Invalid ZK proof", ERROR_CODES.CONTRACT_INVALID_PROOF);
 * }
 * ```
 */
export class ContractError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'ContractError';
  }
}

/**
 * Stealth payment processing error
 *
 * Thrown when stealth payment operations fail.
 *
 * ## Common Causes:
 * - Payment not found (invalid announcement)
 * - Payment already claimed
 * - Insufficient balance for payment
 * - Failed to generate stealth address
 * - Failed to scan for payments
 *
 * ## Error Codes:
 * - PAYMENT_NOT_FOUND
 * - PAYMENT_ALREADY_CLAIMED
 * - PAYMENT_INSUFFICIENT_BALANCE
 *
 * @example
 * ```typescript
 * // Payment not found
 * const payment = await findPayment(announcement);
 * if (!payment) {
 *   throw new PaymentError("Payment not found", ERROR_CODES.PAYMENT_NOT_FOUND);
 * }
 *
 * // Already claimed
 * if (payment.claimed) {
 *   throw new PaymentError("Payment already claimed", ERROR_CODES.PAYMENT_ALREADY_CLAIMED);
 * }
 * ```
 */
export class PaymentError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'PaymentError';
  }
}

/**
 * Zero-knowledge proof error
 *
 * Thrown when ZK proof operations fail.
 *
 * ## Common Causes:
 * - Failed to generate proof
 * - Invalid proof format
 * - Proof verification failed
 * - Missing witness data
 * - Circuit error
 *
 * ## Error Codes:
 * - PROOF_GENERATION_FAILED
 * - PROOF_INVALID
 *
 * @example
 * ```typescript
 * // Proof generation failure
 * try {
 *   const proof = await generateProof(inputs);
 * } catch (error) {
 *   throw new ProofError("Failed to generate proof", ERROR_CODES.PROOF_GENERATION_FAILED);
 * }
 *
 * // Invalid proof
 * if (!verifyProof(proof)) {
 *   throw new ProofError("Proof verification failed", ERROR_CODES.PROOF_INVALID);
 * }
 * ```
 */
export class ProofError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'ProofError';
  }
}

/**
 * Input validation error
 *
 * Thrown when input validation fails.
 *
 * ## Common Causes:
 * - Invalid address format
 * - Invalid hex string
 * - Password too weak
 * - Invalid amount
 * - Invalid key length
 *
 * ## Error Codes:
 * - VALIDATION_FAILED
 * - VALIDATION_INVALID_ADDRESS
 *
 * @example
 * ```typescript
 * // Address validation
 * const result = Validation.validateAddress(address);
 * if (!result.valid) {
 *   throw new ValidationError(result.errors.join("; "), ERROR_CODES.VALIDATION_INVALID_ADDRESS);
 * }
 *
 * // Generic validation failure
 * if (!isValid) {
 *   throw new ValidationError("Validation failed", ERROR_CODES.VALIDATION_FAILED);
 * }
 * ```
 */
export class ValidationError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'ValidationError';
  }
}

/**
 * Network and RPC error
 *
 * Thrown when network operations fail.
 *
 * ## Common Causes:
 * - RPC request failed
 * - Network timeout
 * - Connection lost
 * - Wrong network
 * - Rate limited
 *
 * ## Error Codes:
 * - NETWORK_REQUEST_FAILED
 * - NETWORK_TIMEOUT
 *
 * @example
 * ```typescript
 * // RPC request failure
 * try {
 *   const balance = await provider.getBalance(address);
 * } catch (error) {
 *   throw new NetworkError("Failed to fetch balance", ERROR_CODES.NETWORK_REQUEST_FAILED);
 * }
 *
 * // Timeout
 * const timeout = setTimeout(() => {
 *   throw new NetworkError("Request timed out", ERROR_CODES.NETWORK_TIMEOUT);
 * }, 30000);
 * ```
 */
export class NetworkError extends NinjaRupiahError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'NetworkError';
  }
}

/**
 * Standardized error codes for all application errors
 *
 * Centralized error code constants for consistent error handling,
 * internationalization (i18n), error tracking, and logging.
 *
 * ## Benefits:
 * - Consistent error identification across the application
 * - Easy internationalization mapping (error code -> translated message)
 * - Error analytics and tracking (group by error code)
 * - Type-safe error code references
 *
 * ## Usage Pattern:
 * Use error codes when throwing errors to enable:
 * - Programmatic error handling (switch on error.code)
 * - Error tracking in analytics
 * - Localized error messages
 *
 * ## Categories:
 * - **Auth**: Authentication and authorization (3 codes)
 * - **Key**: Key management and derivation (5 codes)
 * - **Username**: Username validation and registration (5 codes)
 * - **Crypto**: Cryptographic operations (3 codes)
 * - **Storage**: IndexedDB and storage (3 codes)
 * - **Contract**: Smart contract interactions (3 codes)
 * - **Payment**: Stealth payment processing (3 codes)
 * - **Proof**: Zero-knowledge proofs (2 codes)
 * - **Validation**: Input validation (2 codes)
 * - **Network**: Network and RPC (2 codes)
 *
 * @example
 * ```typescript
 * // Throw error with code
 * throw new AuthError("Invalid password", ERROR_CODES.AUTH_INVALID_PASSWORD);
 *
 * // Handle errors by code
 * try {
 *   await operation();
 * } catch (error) {
 *   if (error.code === ERROR_CODES.KEY_LOCKED) {
 *     // Prompt user to unlock
 *     await promptUnlock();
 *   } else if (error.code === ERROR_CODES.STORAGE_NOT_FOUND) {
 *     // Initialize storage
 *     await initializeStorage();
 *   }
 * }
 *
 * // Map to localized messages
 * const i18nMessages = {
 *   [ERROR_CODES.AUTH_INVALID_PASSWORD]: "Mot de passe incorrect",
 *   [ERROR_CODES.USERNAME_TAKEN]: "Nom d'utilisateur déjà pris",
 * };
 *
 * // Track in analytics
 * analytics.track('error', { code: error.code, category: 'auth' });
 * ```
 */
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_PASSWORD: 'AUTH_INVALID_PASSWORD',
  AUTH_WALLET_NOT_CONNECTED: 'AUTH_WALLET_NOT_CONNECTED',
  AUTH_SIGNATURE_WALLET: 'AUTH_SIGNATURE_WALLET',

  // Key errors
  KEY_NOT_INITIALIZED: 'KEY_NOT_INITIALIZED',
  KEY_LOCKED: 'KEY_LOCKED',
  KEY_INVALID: 'KEY_INVALID',
  KEY_DERIVATION_FAILED: 'KEY_DERIVATION_FAILED',
  KEY_ALREADY_EXISTS: 'KEY_ALREADY_EXISTS',

  // Username errors
  USERNAME_INVALID_FORMAT: 'USERNAME_INVALID_FORMAT',
  USERNAME_TOO_LONG: 'USERNAME_TOO_LONG',
  USERNAME_TOO_SHORT: 'USERNAME_TOO_SHORT',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  USERNAME_INVALID_CHARS: 'USERNAME_INVALID_CHARS',

  // Crypto errors
  CRYPTO_ENCRYPTION_FAILED: 'CRYPTO_ENCRYPTION_FAILED',
  CRYPTO_DECRYPTION_FAILED: 'CRYPTO_DECRYPTION_FAILED',
  CRYPTO_INVALID_KEY: 'CRYPTO_INVALID_KEY',

  // Storage errors
  STORAGE_READ_FAILED: 'STORAGE_READ_FAILED',
  STORAGE_WRITE_FAILED: 'STORAGE_WRITE_FAILED',
  STORAGE_NOT_FOUND: 'STORAGE_NOT_FOUND',

  // Contract errors
  CONTRACT_CALL_FAILED: 'CONTRACT_CALL_FAILED',
  CONTRACT_TX_FAILED: 'CONTRACT_TX_FAILED',
  CONTRACT_INVALID_PROOF: 'CONTRACT_INVALID_PROOF',

  // Payment errors
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_CLAIMED: 'PAYMENT_ALREADY_CLAIMED',
  PAYMENT_INSUFFICIENT_BALANCE: 'PAYMENT_INSUFFICIENT_BALANCE',

  // Proof errors
  PROOF_GENERATION_FAILED: 'PROOF_GENERATION_FAILED',
  PROOF_INVALID: 'PROOF_INVALID',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_INVALID_ADDRESS: 'VALIDATION_INVALID_ADDRESS',

  // Network errors
  NETWORK_REQUEST_FAILED: 'NETWORK_REQUEST_FAILED',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
};

/**
 * Type guard to check if error is AuthError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to AuthError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is AuthError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await KeyManager.unlock(password);
 * } catch (error) {
 *   if (isAuthError(error)) {
 *     // TypeScript now knows error is AuthError
 *     console.error("Auth failed:", error.message, error.code);
 *   }
 * }
 * ```
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Type guard to check if error is KeyError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to KeyError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is KeyError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await KeyManager.deriveKeys(password);
 * } catch (error) {
 *   if (isKeyError(error)) {
 *     console.error("Key error:", error.message);
 *   }
 * }
 * ```
 */
export function isKeyError(error: unknown): error is KeyError {
  return error instanceof KeyError;
}

/**
 * Type guard to check if error is UsernameError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to UsernameError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is UsernameError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await registerUsername(username);
 * } catch (error) {
 *   if (isUsernameError(error)) {
 *     console.error("Username error:", error.message);
 *   }
 * }
 * ```
 */
export function isUsernameError(error: unknown): error is UsernameError {
  return error instanceof UsernameError;
}

/**
 * Type guard to check if error is CryptoError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to CryptoError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is CryptoError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   const encrypted = await Encryption.encrypt(data, key);
 * } catch (error) {
 *   if (isCryptoError(error)) {
 *     console.error("Encryption failed:", error.message);
 *   }
 * }
 * ```
 */
export function isCryptoError(error: unknown): error is CryptoError {
  return error instanceof CryptoError;
}

/**
 * Type guard to check if error is StorageError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to StorageError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is StorageError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   const data = await Storage.load('keys');
 * } catch (error) {
 *   if (isStorageError(error)) {
 *     console.error("Storage error:", error.message);
 *   }
 * }
 * ```
 */
export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

/**
 * Type guard to check if error is ContractError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to ContractError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is ContractError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   const tx = await contract.registerUsername(username, commitment);
 *   await tx.wait();
 * } catch (error) {
 *   if (isContractError(error)) {
 *     console.error("Contract error:", error.message);
 *   }
 * }
 * ```
 */
export function isContractError(error: unknown): error is ContractError {
  return error instanceof ContractError;
}

/**
 * Type guard to check if error is PaymentError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to PaymentError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is PaymentError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   const payment = await findPayment(announcement);
 * } catch (error) {
 *   if (isPaymentError(error)) {
 *     console.error("Payment error:", error.message);
 *   }
 * }
 * ```
 */
export function isPaymentError(error: unknown): error is PaymentError {
  return error instanceof PaymentError;
}

/**
 * Type guard to check if error is ProofError
 *
 * TypeScript type guard for runtime type checking.
 * Narrows unknown error types to ProofError for safe access.
 *
 * @param error - Error to check
 * @returns true if error is ProofError instance, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   const proof = await generateProof(inputs);
 * } catch (error) {
 *   if (isProofError(error)) {
 *     console.error("Proof error:", error.message);
 *   }
 * }
 * ```
 */
export function isProofError(error: unknown): error is ProofError {
  return error instanceof ProofError;
}

/**
 * Format any error as a human-readable string
 *
 * Safely extracts error message from any error type.
 * Handles NinjaRupiah errors, standard errors, and unknown values.
 *
 * ## Behavior:
 * - NinjaRupiahError instances: returns error.message
 * - Standard Error instances: returns error.message
 * - Other values: converts to string with String()
 *
 * ## Use Cases:
 * - Display errors to users in UI (toast, alert)
 * - Log errors consistently
 * - Extract message from unknown error types
 *
 * @param error - Error value to format (any type)
 * @returns Human-readable error message string
 *
 * @example
 * ```typescript
 * // Format typed error
 * const error = new AuthError("Invalid password");
 * console.log(formatError(error)); // "Invalid password"
 *
 * // Format unknown error
 * try {
 *   await someOperation();
 * } catch (error) {
 *   // Safe to format any error type
 *   toast.error(formatError(error));
 * }
 *
 * // Format non-Error values
 * console.log(formatError("Something went wrong")); // "Something went wrong"
 * console.log(formatError(null)); // "null"
 * console.log(formatError(undefined)); // "undefined"
 * ```
 */
export function formatError(error: unknown): string {
  if (error instanceof NinjaRupiahError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Parse wallet/contract errors into user-friendly messages
 *
 * Converts raw technical errors from wallets, contracts, and RPCs
 * into clean, user-friendly messages suitable for display.
 *
 * ## Handled Error Types:
 * - User rejected transaction
 * - RPC/network errors
 * - Insufficient gas
 * - Contract reverts (with specific error detection)
 * - Long hex strings (truncated)
 *
 * @param err - Error to parse (any type)
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await registerUsername(...);
 * } catch (err) {
 *   const message = parseErrorMessage(err);
 *   setError(message); // "Transaction was rejected. Please try again."
 * }
 * ```
 */
export function parseErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  // User rejected transaction
  if (message.includes('rejected') || message.includes('denied') || message.includes('cancelled')) {
    return 'Transaction was rejected. Please try again.';
  }

  // RPC errors
  if (message.includes('404') || message.includes('RPC') || message.includes('HTTP request failed')) {
    return 'Network error. Please check your wallet connection.';
  }

  // Insufficient gas
  if (message.includes('insufficient funds') || message.includes('gas')) {
    return 'Insufficient funds for gas. Please add ETH to your wallet.';
  }

  // Contract reverted
  if (message.includes('revert') || message.includes('execution reverted')) {
    if (message.includes('UsernameAlreadyTaken')) {
      return 'This username is already taken.';
    }
    if (message.includes('UserAlreadyHasUsername')) {
      return 'You already have a registered username.';
    }
    if (message.includes('InvalidProof')) {
      return 'Proof verification failed. Please try again.';
    }
    if (message.includes('MetaKeysAlreadyRegistered')) {
      return 'Meta keys already registered for this wallet.';
    }
    return 'Transaction failed. Please try again.';
  }

  // Fallback - truncate long messages
  if (message.length > 100) {
    return 'An error occurred. Please try again.';
  }

  return message;
}
