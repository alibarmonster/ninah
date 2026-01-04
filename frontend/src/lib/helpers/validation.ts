import zxcvbn from 'zxcvbn';
import { PASSWORD_REQUIREMENT, ZERO_ADDRESS, MAX_USERNAME_LENGTH } from '@/lib/helpers/constants';
import { ValidationError } from '@/lib/helpers/errors';
import { Encoding } from '@/lib/helpers/encoding';

/**
 * Generic validation result
 *
 * Standard return type for validation functions.
 * Contains validation status and descriptive error messages.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Array of error messages (empty if valid) */
  errors: string[];
}

/**
 * Password validation result with strength analysis
 *
 * Extended validation result that includes password strength metrics
 * from zxcvbn library analysis.
 */
export interface PasswordValidationResult extends ValidationResult {
  /** Password strength score: 0 (very weak) to 4 (very strong) */
  strength: number;
  /** Human-readable strength label */
  strengthLabel: 'very weak' | 'weak' | 'fair' | 'strong' | 'very strong';
  /** Suggestions to improve password strength */
  suggestions: string[];
  /** Warning about password weaknesses */
  warning: string;
}

/**
 * Validation Utilities for NinjaRupiah
 *
 * Comprehensive input validation for user data, cryptographic primitives,
 * and blockchain-related values. Provides descriptive error messages
 * and type-safe validation results.
 *
 * ## Validation Categories:
 * - **Passwords**: Strength analysis with zxcvbn, policy enforcement
 * - **Addresses**: Ethereum address format and EIP-55 checksum validation
 * - **Hexadecimal**: Hex string format and length validation
 * - **Amounts**: Currency amount validation with decimal precision
 * - **Bytes**: Byte array length validation
 * - **Usernames**: Format validation per NinjaRupiah rules
 * - **Keys**: Public/private key format validation
 *
 * ## Security Features:
 * - Password strength analysis (prevents weak passwords)
 * - Checksum validation (prevents address typos)
 * - Type guards for runtime type safety
 * - Detailed error messages for user feedback
 *
 * ## Usage Pattern:
 * All validation methods return ValidationResult with:
 * - `valid`: boolean indicating pass/fail
 * - `errors`: array of human-readable error messages
 *
 * @example
 * ```typescript
 * // Validate password
 * const passwordResult = Validation.validatePassword(userPassword);
 * if (!passwordResult.valid) {
 *   console.error(passwordResult.errors);
 * }
 *
 * // Validate address
 * const addressResult = Validation.validateAddress(userAddress);
 * if (addressResult.valid) {
 *   await sendPayment(userAddress);
 * }
 *
 * // Assert valid (throws on failure)
 * const hexResult = Validation.validateHex(publicKey, 33);
 * Validation.assertValid(hexResult, "Invalid public key");
 * ```
 */
export class Validation {
  /**
   * Check password strength using zxcvbn library
   *
   * Analyzes password entropy and patterns to determine strength.
   * Uses Dropbox's zxcvbn library for industry-standard analysis.
   *
   * ## Strength Scores:
   * - 0: very weak - too guessable (risky password)
   * - 1: weak - very guessable (protection from throttled attacks)
   * - 2: fair - somewhat guessable (moderate protection)
   * - 3: strong - safely unguessable (moderate protection from offline attacks)
   * - 4: very strong - very unguessable (strong protection from offline attacks)
   *
   * ## Analysis Includes:
   * - Dictionary words
   * - Common passwords
   * - Repeated characters
   * - Sequential patterns (123, abc)
   * - Keyboard patterns (qwerty)
   * - Dates and years
   *
   * @param password - Password string to analyze
   * @param userInputs - Optional user-specific words to penalize (username, email, etc.)
   * @returns Detailed strength analysis with score and suggestions
   *
   * @example
   * ```typescript
   * // Basic strength check
   * const result = Validation.checkPasswordStrength(userInputPassword);
   * console.log(result.strength); // 2
   * console.log(result.strengthLabel); // "fair"
   *
   * // With user inputs (penalize personal info)
   * const result2 = Validation.checkPasswordStrength(passwordInput, ["username", "user@example.com"]);
   * console.log(result2.suggestions); // ["Add more words", "Avoid predictable patterns"]
   * ```
   */
  static checkPasswordStrength(password: string, userInputs?: string[]): PasswordValidationResult {
    const result = zxcvbn(password, userInputs);

    const strengthLabels: ['very weak', 'weak', 'fair', 'strong', 'very strong'] = [
      'very weak',
      'weak',
      'fair',
      'strong',
      'very strong',
    ];

    return {
      valid: result.score >= 3,
      strength: result.score,
      strengthLabel: strengthLabels[result.score],
      suggestions: result.feedback.suggestions || [],
      warning: result.feedback.warning || '',
      errors: result.score < 3 ? ['Password strength is insufficient'] : [],
    };
  }

  /**
   * Validate password against requirements
   *
   * Comprehensive password validation combining policy requirements
   * with strength analysis. Enforces configurable password rules.
   *
   * ## Validation Checks:
   * 1. Minimum length (from PASSWORD_REQUIREMENT)
   * 2. Character requirements (uppercase, lowercase, numbers, special chars)
   * 3. Weak pattern detection (all same character, sequences)
   * 4. Strength analysis via zxcvbn (score >= 3 required)
   *
   * ## Default Requirements (configurable via constants):
   * - Minimum 12 characters
   * - At least one uppercase letter (A-Z)
   * - At least one lowercase letter (a-z)
   * - At least one number (0-9)
   * - At least one special character (!@#$%^&*)
   *
   * ## Rejected Patterns:
   * - All same character (e.g., "aaaaaaa")
   * - Sequential characters (e.g., "123456", "abcdef")
   *
   * @param password - Password string to validate
   * @param userInputs - Optional user-specific words to penalize in strength check
   * @returns Validation result with errors, strength score, and suggestions
   *
   * @example
   * ```typescript
   * // Valid strong password (example: complex password with special chars, numbers, upper/lowercase)
   * const result1 = Validation.validatePassword(strongPasswordInput);
   * console.log(result1.valid); // true
   * console.log(result1.strength); // 4
   *
   * // Invalid: too short (example: less than 12 characters)
   * const result2 = Validation.validatePassword(shortPasswordInput);
   * console.log(result2.errors); // ["Password must be at least 12 characters long"]
   *
   * // Invalid: weak password (example: common dictionary word)
   * const result3 = Validation.validatePassword(weakPasswordInput);
   * console.log(result3.errors); // ["Password strength is insufficient", ...]
   * ```
   */
  static validatePassword(password: string, userInputs?: string[]): PasswordValidationResult {
    const errors: string[] = [];
    const { minLength, requireUpperCase, requireLowerCase, requireNumbers, requireSpecialChars } = PASSWORD_REQUIREMENT;

    if (!password) {
      return {
        valid: false,
        errors: ['Password is required'],
        strength: 0,
        strengthLabel: 'very weak',
        suggestions: ['Enter a password'],
        warning: 'Password cannot be empty',
      };
    }

    // Length validation
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    // Character requirements
    if (requireUpperCase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    }

    if (requireLowerCase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number (0-9)');
    }

    if (requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    // Check for common weak patterns
    if (/^(.)\1+$/.test(password)) {
      errors.push('Password cannot be all the same character');
    }

    if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)+/i.test(password)) {
      errors.push('Password cannot contain sequential characters');
    }

    // Use zxcvbn for strength analysis
    const strengthResult = this.checkPasswordStrength(password, userInputs);

    // Combine errors
    const allErrors = [...errors, ...strengthResult.errors];

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      strength: strengthResult.strength,
      strengthLabel: strengthResult.strengthLabel,
      suggestions: strengthResult.suggestions,
      warning: strengthResult.warning,
    };
  }

  /**
   * Check if password is commonly used
   *
   * Quick check to determine if a password is in common password databases.
   * Uses zxcvbn's dictionary matching (score <= 1 means common/weak).
   *
   * ## Use Case:
   * Fast pre-check before full validation to reject obviously weak passwords.
   *
   * @param password - Password string to check
   * @returns true if password is common/weak, false if uncommon
   *
   * @example
   * ```typescript
   * console.log(Validation.isCommonPassword("password")); // true - common word
   * console.log(Validation.isCommonPassword("123456")); // true - sequential numbers
   * console.log(Validation.isCommonPassword(strongPassword)); // false - complex password
   * ```
   */
  static isCommonPassword(password: string): boolean {
    const result = zxcvbn(password);
    return result.score <= 1;
  }

  /**
   * Validate Ethereum address with checksum verification
   *
   * Comprehensive address validation including format, length, hex characters,
   * zero address check, and optional EIP-55 checksum verification.
   *
   * ## Validation Steps:
   * 1. Required: Non-empty, has 0x prefix
   * 2. Required: Exactly 42 characters (0x + 40 hex)
   * 3. Required: Valid hex characters (0-9, a-f, A-F)
   * 4. Required: Not zero address (0x0000...0000)
   * 5. Optional: EIP-55 checksum correctness
   *
   * ## Checksum Validation:
   * - If address has mixed case, checksum is always validated
   * - If requireChecksum=true, checksum is always validated
   * - All lowercase or uppercase addresses skip checksum (no checksum present)
   *
   * @param address - Ethereum address to validate
   * @param requireChecksum - If true, require valid checksum (default: false)
   * @returns Validation result with descriptive errors
   *
   * @example
   * ```typescript
   * // Valid checksummed address
   * const result1 = Validation.validateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
   * console.log(result1.valid); // true
   *
   * // Invalid: zero address
   * const result2 = Validation.validateAddress("0x0000000000000000000000000000000000000000");
   * console.log(result2.errors); // ["Address cannot be the zero address"]
   *
   * // Invalid: wrong checksum
   * const result3 = Validation.validateAddress("0x742d35CC6634C0532925a3b844Bc9e7595f0bEb0");
   * console.log(result3.errors); // ["Address checksum is invalid (EIP-55)"]
   * ```
   */
  static validateAddress(address: string, requireChecksum: boolean = false): ValidationResult {
    const errors: string[] = [];

    if (!address) {
      errors.push('Address is required');
      return { valid: false, errors };
    }

    if (!address.startsWith('0x')) {
      errors.push('Address must start with 0x prefix');
      return { valid: false, errors };
    }

    if (address.length !== 42) {
      errors.push('Address must be 42 characters (including 0x prefix)');
      return { valid: false, errors };
    }

    // Validate hex characters
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      errors.push('Address must contain only hexadecimal characters (0-9, a-f, A-F)');
      return { valid: false, errors };
    }

    // Check for zero address
    if (address.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
      errors.push('Address cannot be the zero address (0x0000...0000)');
      return { valid: false, errors };
    }

    // Validate checksum if address has mixed case or checksum is required
    const hex = address.slice(2);
    const hasMixedCase = hex !== hex.toLowerCase() && hex !== hex.toUpperCase();

    if (hasMixedCase || requireChecksum) {
      try {
        if (!Encoding.isValidChecksumAddress(address)) {
          errors.push('Address checksum is invalid (EIP-55)');
        }
      } catch (error) {
        errors.push(`Failed to validate address checksum message: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate hexadecimal string with optional length requirement
   *
   * Validates hex string format, even length, and optional byte length.
   * Supports with or without 0x prefix.
   *
   * ## Validation:
   * - Non-empty string
   * - Even number of hex characters (2 chars = 1 byte)
   * - Only hex characters (0-9, a-f, A-F)
   * - Optional: exact byte length
   *
   * @param hex - Hexadecimal string to validate
   * @param expectedLength - Optional expected length in bytes
   * @returns Validation result with descriptive errors
   *
   * @example
   * ```typescript
   * // Valid hex string
   * const result1 = Validation.validateHex("0x1234abcd");
   * console.log(result1.valid); // true
   *
   * // Valid hex with length check (32 bytes)
   * const result2 = Validation.validateHex("0x" + "00".repeat(32), 32);
   * console.log(result2.valid); // true
   *
   * // Invalid: odd length
   * const result3 = Validation.validateHex("0x123");
   * console.log(result3.errors); // ["Hex string must have even length (2 characters per byte)"]
   *
   * // Invalid: wrong length
   * const result4 = Validation.validateHex("0x1234", 32);
   * console.log(result4.errors); // ["Hex string must be 32 bytes (64 hex characters)"]
   * ```
   */
  static validateHex(hex: string, expectedLength?: number): ValidationResult {
    const errors: string[] = [];

    if (!hex) {
      errors.push('Hex string is required');
      return { valid: false, errors };
    }

    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

    if (cleanHex.length === 0) {
      errors.push('Hex string cannot be empty');
      return { valid: false, errors };
    }

    if (cleanHex.length % 2 !== 0) {
      errors.push('Hex string must have even length (2 characters per byte)');
    }

    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
      errors.push('Hex string must contain only hexadecimal characters (0-9, a-f, A-F)');
    }

    if (expectedLength !== undefined && cleanHex.length !== expectedLength * 2) {
      errors.push(`Hex string must be ${expectedLength} bytes (${expectedLength * 2} hex characters)`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate transaction amount (for currency)
   *
   * Validates numeric amounts for token/currency transactions.
   * Enforces positive values, finite numbers, and decimal precision limits.
   *
   * ## Validation:
   * - Required: Non-empty value
   * - Required: Valid number (not NaN)
   * - Required: Finite (not Infinity)
   * - Required: Positive (> 0, not -0)
   * - Required: Within JavaScript safe integer range
   * - Optional: Max decimal places (default: 18 for wei precision)
   *
   * @param amount - Amount as string or number
   * @param maxDecimals - Maximum decimal places allowed (default: 18 for Ethereum)
   * @returns Validation result with descriptive errors
   *
   * @example
   * ```typescript
   * // Valid amount
   * const result1 = Validation.validateAmount("100.50");
   * console.log(result1.valid); // true
   *
   * // Valid with decimal limit
   * const result2 = Validation.validateAmount("0.123456", 6);
   * console.log(result2.valid); // true
   *
   * // Invalid: zero
   * const result3 = Validation.validateAmount("0");
   * console.log(result3.errors); // ["Amount must be greater than zero"]
   *
   * // Invalid: too many decimals
   * const result4 = Validation.validateAmount("1.1234567890123456789", 18);
   * console.log(result4.errors); // ["Amount cannot have more than 18 decimal places"]
   *
   * // Invalid: negative
   * const result5 = Validation.validateAmount("-100");
   * console.log(result5.errors); // ["Amount must be greater than zero"]
   * ```
   */
  static validateAmount(amount: string | number, maxDecimals: number = 18): ValidationResult {
    const errors: string[] = [];

    if (amount === '' || amount === null || amount === undefined) {
      errors.push('Amount is required');
      return { valid: false, errors };
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      errors.push('Amount must be a valid number');
      return { valid: false, errors };
    }

    if (!isFinite(numAmount)) {
      errors.push('Amount must be a finite number');
      return { valid: false, errors };
    }

    if (numAmount <= 0 || Object.is(numAmount, -0)) {
      errors.push('Amount must be greater than zero');
      return { valid: false, errors };
    }

    // Check decimal places
    if (typeof amount === 'string') {
      const parts = amount.split('.');
      if (parts.length > 1) {
        const decimals = parts[1].length;
        if (decimals > maxDecimals) {
          errors.push(`Amount cannot have more than ${maxDecimals} decimal places`);
        }
      }
    }

    // Check for safe number range (JavaScript number limits)
    if (numAmount > Number.MAX_SAFE_INTEGER) {
      errors.push('Amount exceeds maximum safe value');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Uint8Array byte length
   *
   * Type-safe validation for byte array length.
   * Returns ValidationResult instead of throwing.
   *
   * ## Validation:
   * - Value must be Uint8Array instance
   * - Length must match expected exactly
   *
   * @param bytes - Byte array to validate
   * @param expectedLength - Expected length in bytes
   * @param name - Descriptive name for error messages (default: "bytes")
   * @returns Validation result with descriptive errors
   *
   * @example
   * ```typescript
   * // Valid: 32-byte private key
   * const privateKey = new Uint8Array(32);
   * const result1 = Validation.validateBytesLength(privateKey, 32, 'private key');
   * console.log(result1.valid); // true
   *
   * // Invalid: wrong length
   * const publicKey = new Uint8Array(65);
   * const result2 = Validation.validateBytesLength(publicKey, 33, 'public key');
   * console.log(result2.errors); // ["public key must be exactly 33 bytes, received 65 bytes"]
   *
   * // Invalid: not Uint8Array
   * const result3 = Validation.validateBytesLength([1, 2, 3] as any, 3);
   * console.log(result3.errors); // ["bytes must be a Uint8Array"]
   * ```
   */
  static validateBytesLength(bytes: Uint8Array, expectedLength: number, name: string = 'bytes'): ValidationResult {
    const errors: string[] = [];

    if (!(bytes instanceof Uint8Array)) {
      errors.push(`${name} must be a Uint8Array`);
      return { valid: false, errors };
    }

    if (bytes.length !== expectedLength) {
      errors.push(`${name} must be exactly ${expectedLength} bytes, received ${bytes.length} bytes`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate username format
   *
   * Basic username validation for NinjaRupiah usernames.
   * Enforces alphanumeric characters with limited special chars.
   *
   * ## Rules:
   * - Required: Non-empty string
   * - Max length: 32 characters (from MAX_USERNAME_LENGTH)
   * - Allowed characters: letters, numbers, dots (.), hyphens (-), underscores (_)
   * - Must start and end with alphanumeric character
   * - Cannot have consecutive special characters (no "..", "--", "__")
   *
   * ## Note:
   * This is basic format validation. See username/validation.ts
   * for comprehensive validation including profanity filters and reservations.
   *
   * @param username - Username string to validate
   * @returns Validation result with descriptive errors
   *
   * @example
   * ```typescript
   * // Valid usernames
   * console.log(Validation.validateUsername("alice").valid); // true
   * console.log(Validation.validateUsername("alice_2024").valid); // true
   * console.log(Validation.validateUsername("alice.bob").valid); // true
   *
   * // Invalid: starts with special char
   * const result1 = Validation.validateUsername("_alice");
   * console.log(result1.errors); // ["Username must start with a letter or number"]
   *
   * // Invalid: consecutive special chars
   * const result2 = Validation.validateUsername("alice..bob");
   * console.log(result2.errors); // ["Username cannot contain consecutive special characters"]
   *
   * // Invalid: too long
   * const result3 = Validation.validateUsername("a".repeat(33));
   * console.log(result3.errors); // ["Username must not exceed 32 characters"]
   * ```
   */
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];

    if (!username || username.length === 0) {
      errors.push('Username is required');
      return { valid: false, errors };
    }

    if (username.length > MAX_USERNAME_LENGTH) {
      errors.push(`Username must not exceed ${MAX_USERNAME_LENGTH} characters`);
    }

    // Check for valid characters (alphanumeric + . - _)
    if (!/^[a-z0-9._-]+$/i.test(username)) {
      errors.push('Username can only contain letters, numbers, dots, hyphens, and underscores');
    }

    // Check first and last character (must be alphanumeric)
    if (!/^[a-z0-9]/i.test(username[0])) {
      errors.push('Username must start with a letter or number');
    }

    if (!/[a-z0-9]$/i.test(username)) {
      errors.push('Username must end with a letter or number');
    }

    // Check for consecutive special characters
    if (/[._-]{2,}/.test(username)) {
      errors.push('Username cannot contain consecutive special characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate secp256k1 public key format
   *
   * Validates public key byte array for correct secp256k1 format.
   * Supports both compressed (33 bytes) and uncompressed (65 bytes) formats.
   *
   * ## Valid Formats:
   * - Compressed: 33 bytes, starts with 0x02 or 0x03
   * - Uncompressed: 65 bytes, starts with 0x04
   *
   * ## Validation:
   * - Must be Uint8Array
   * - Length must be 33 (compressed) or 65 (uncompressed)
   * - First byte must match format:
   *   - Compressed: 0x02 (even y) or 0x03 (odd y)
   *   - Uncompressed: 0x04
   *
   * @param publicKey - Public key byte array to validate
   * @returns Validation result with descriptive errors
   *
   * @example
   * ```typescript
   * // Valid compressed public key
   * const compressedKey = new Uint8Array(33);
   * compressedKey[0] = 0x02; // Even y-coordinate
   * const result1 = Validation.validatePublicKey(compressedKey);
   * console.log(result1.valid); // true
   *
   * // Valid uncompressed public key
   * const uncompressedKey = new Uint8Array(65);
   * uncompressedKey[0] = 0x04;
   * const result2 = Validation.validatePublicKey(uncompressedKey);
   * console.log(result2.valid); // true
   *
   * // Invalid: wrong length
   * const invalidKey = new Uint8Array(32);
   * const result3 = Validation.validatePublicKey(invalidKey);
   * console.log(result3.errors); // ["Public key must be 33 bytes (compressed) or 65 bytes (uncompressed), received 32 bytes"]
   *
   * // Invalid: wrong prefix
   * const wrongPrefix = new Uint8Array(33);
   * wrongPrefix[0] = 0x05; // Invalid prefix
   * const result4 = Validation.validatePublicKey(wrongPrefix);
   * console.log(result4.errors); // ["Compressed public key must start with 0x02 or 0x03"]
   * ```
   */
  static validatePublicKey(publicKey: Uint8Array): ValidationResult {
    const errors: string[] = [];

    if (!(publicKey instanceof Uint8Array)) {
      errors.push('Public key must be a Uint8Array');
      return { valid: false, errors };
    }

    const validLengths = [33, 65]; // Compressed or uncompressed
    if (!validLengths.includes(publicKey.length)) {
      errors.push(
        `Public key must be 33 bytes (compressed) or 65 bytes (uncompressed), received ${publicKey.length} bytes`,
      );
    }

    // Compressed keys should start with 0x02 or 0x03
    if (publicKey.length === 33 && publicKey[0] !== 0x02 && publicKey[0] !== 0x03) {
      errors.push('Compressed public key must start with 0x02 or 0x03');
    }

    // Uncompressed keys should start with 0x04
    if (publicKey.length === 65 && publicKey[0] !== 0x04) {
      errors.push('Uncompressed public key must start with 0x04');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate secp256k1 private key format
   *
   * Validates private key byte array for correct secp256k1 format.
   * Ensures 32-byte length and non-zero value.
   *
   * ## Validation:
   * - Must be Uint8Array
   * - Exactly 32 bytes (256 bits)
   * - Cannot be all zeros (invalid private key)
   *
   * ## Note:
   * This only validates format, not whether the key is on the curve.
   * For full validation, use Secp256k1.isValidPrivateKey().
   *
   * @param privateKey - Private key byte array to validate
   * @returns Validation result with descriptive errors
   *
   * @example
   * ```typescript
   * // Valid private key
   * const privateKey = new Uint8Array(32);
   * privateKey[0] = 0x01; // Non-zero
   * const result1 = Validation.validatePrivateKey(privateKey);
   * console.log(result1.valid); // true
   *
   * // Invalid: wrong length
   * const shortKey = new Uint8Array(16);
   * const result2 = Validation.validatePrivateKey(shortKey);
   * console.log(result2.errors); // ["Private key must be exactly 32 bytes, received 16 bytes"]
   *
   * // Invalid: all zeros
   * const zeroKey = new Uint8Array(32); // All zeros by default
   * const result3 = Validation.validatePrivateKey(zeroKey);
   * console.log(result3.errors); // ["Private key cannot be all zeros"]
   *
   * // Invalid: not Uint8Array
   * const result4 = Validation.validatePrivateKey("not a key" as any);
   * console.log(result4.errors); // ["Private key must be a Uint8Array"]
   * ```
   */
  static validatePrivateKey(privateKey: Uint8Array): ValidationResult {
    const errors: string[] = [];

    if (!(privateKey instanceof Uint8Array)) {
      errors.push('Private key must be a Uint8Array');
      return { valid: false, errors };
    }

    if (privateKey.length !== 32) {
      errors.push(`Private key must be exactly 32 bytes, received ${privateKey.length} bytes`);
    }

    // Check that it's not all zeros
    const isAllZeros = privateKey.every((byte) => byte === 0);
    if (isAllZeros) {
      errors.push('Private key cannot be all zeros');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Assert validation result is valid, throw error if not
   *
   * Converts validation result into an exception for fail-fast behavior.
   * Useful when validation failure should halt execution.
   *
   * ## Use Cases:
   * - Input validation in functions (fail early if invalid)
   * - Pre-condition checks in critical operations
   * - Converting soft validation to hard requirements
   *
   * ## Behavior:
   * - If result.valid = true: returns normally (no-op)
   * - If result.valid = false: throws ValidationError with all errors joined
   *
   * @param result - Validation result to assert
   * @param errorMessage - Optional custom error message (default: joined errors)
   *
   * @throws {ValidationError} If validation result is invalid
   *
   * @example
   * ```typescript
   * // Use in function to fail fast
   * function deriveKey(privateKey: Uint8Array) {
   *   const validation = Validation.validatePrivateKey(privateKey);
   *   Validation.assertValid(validation); // Throws if invalid
   *
   *   // If we get here, privateKey is guaranteed valid
   *   return Kdf.deriveSubKey(privateKey);
   * }
   *
   * // With custom error message
   * function sendPayment(address: string, amount: string) {
   *   const addressValidation = Validation.validateAddress(address);
   *   Validation.assertValid(addressValidation, "Invalid recipient address");
   *
   *   const amountValidation = Validation.validateAmount(amount);
   *   Validation.assertValid(amountValidation, "Invalid payment amount");
   *
   *   // Both are valid, proceed with payment
   *   return contract.transfer(address, amount);
   * }
   *
   * // Usage
   * try {
   *   deriveKey(invalidKey);
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.error("Validation failed:", error.message);
   *   }
   * }
   * ```
   */
  static assertValid(result: ValidationResult, errorMessage?: string): void {
    if (!result.valid) {
      const message = errorMessage || result.errors.join('; ');
      throw new ValidationError(message);
    }
  }
}
