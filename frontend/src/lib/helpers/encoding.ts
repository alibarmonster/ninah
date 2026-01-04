import { Bytes } from '@/lib/helpers/bytes';
import { keccak_256 } from '@noble/hashes/sha3.js';

/**
 * Encoding Utilities for Ethereum and NinjaRupiah
 *
 * Provides comprehensive encoding/decoding utilities for Ethereum-compatible data:
 * - EIP-55 checksum addresses (prevents typos and case errors)
 * - Hexadecimal validation and conversion
 * - BigInt encoding for large numbers
 * - Storage data serialization (JSON + Base64)
 * - Address validation and normalization
 *
 * ## Key Features:
 * - Full EIP-55 checksum address support
 * - Type-safe BigInt operations
 * - Browser-compatible (no Node.js dependencies)
 * - Comprehensive validation with descriptive errors
 *
 * ## Use Cases:
 * - Validate Ethereum addresses before transactions
 * - Convert between address formats (bytes, hex, checksum)
 * - Encode/decode contract parameters
 * - Serialize data for IndexedDB storage
 * - Prepare data for blockchain transactions
 *
 * @example
 * ```typescript
 * // Validate and checksum an address
 * const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
 * const checksummed = Encoding.toChecksumAddress(addr);
 *
 * // Encode BigInt for contracts
 * const amount = 1000000000000000000n; // 1 ETH in wei
 * const hex = Encoding.encodeBigInt(amount);
 *
 * // Serialize data for storage
 * const data = { username: "alice", balance: 100n };
 * const encoded = Encoding.encodeStorageData(data);
 * await db.save('user_data', encoded);
 * ```
 */
export class Encoding {
  /**
   * Convert address to EIP-55 checksum format
   *
   * Implements EIP-55 checksum encoding to prevent address typos.
   * Mixed-case checksum helps detect copy/paste errors.
   *
   * ## How It Works:
   * 1. Hash the lowercase address with Keccak256
   * 2. For each hex character, if hash digit >= 8, uppercase it
   * 3. Result has mixed case that encodes a checksum
   *
   * ## Why It Matters:
   * - Detects typos before sending transactions
   * - Standard across Ethereum ecosystem
   * - Prevents loss of funds from wrong addresses
   *
   * ## EIP-55 Example:
   * Input:  "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"
   * Output: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD"
   * Notice mixed case encodes checksum information
   *
   * @param address - Ethereum address (string or bytes)
   * @returns EIP-55 checksummed address with 0x prefix
   *
   * @throws {Error} If address length is not 20 bytes / 40 hex chars
   * @throws {Error} If address contains invalid hex characters
   *
   * @example
   * ```typescript
   * // From lowercase address
   * const addr = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0";
   * const checksum = Encoding.toChecksumAddress(addr);
   * console.log(checksum); // "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
   *
   * // From bytes (stealth address)
   * const stealthAddr = Address.deriveStealthAddress(spendPub, sharedSecret);
   * const checksummed = Encoding.toChecksumAddress(stealthAddr);
   * ```
   */
  static toChecksumAddress(address: string | Uint8Array): string {
    const hex =
      typeof address === 'string' ? address.toLowerCase().replace('0x', '') : Bytes.bytesToHex(address, false);

    if (hex.length !== 40) {
      throw new Error('Invalid address length');
    }

    if (!/^[0-9a-f]{40}$/.test(hex)) {
      throw new Error('Invalid hex characters in address');
    }

    const hash = keccak_256(Bytes.stringToBytes(hex));
    const hashHex = Bytes.bytesToHex(hash, false);

    let checksumAddress = '0x';

    for (let i = 0; i < hex.length; i++) {
      const char = hex[i];
      if (parseInt(hashHex[i], 16) >= 8) {
        checksumAddress += char.toUpperCase();
      } else {
        checksumAddress += char;
      }
    }
    return checksumAddress;
  }

  /**
   * Verify if address has valid EIP-55 checksum
   *
   * Validates that an address has correct mixed-case checksum encoding.
   * Accepts all-lowercase or all-uppercase as valid (no checksum).
   *
   * ## Validation Rules:
   * - All lowercase = valid (no checksum)
   * - All uppercase = valid (no checksum)
   * - Mixed case = must match EIP-55 checksum
   *
   * @param address - Ethereum address to validate
   * @returns true if checksum is valid or not present, false otherwise
   *
   * @example
   * ```typescript
   * // Valid checksummed address
   * const valid1 = Encoding.isValidChecksumAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
   * console.log(valid1); // true
   *
   * // All lowercase (no checksum, but valid)
   * const valid2 = Encoding.isValidChecksumAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb0");
   * console.log(valid2); // true
   *
   * // Invalid checksum (wrong case)
   * const invalid = Encoding.isValidChecksumAddress("0x742d35CC6634c0532925a3b844bc9e7595f0beb0");
   * console.log(invalid); // false
   * ```
   */
  static isValidChecksumAddress(address: string): boolean {
    if (!this.isValidAddress(address)) {
      return false;
    }

    const hex = address.slice(2);
    if (hex === hex.toLowerCase() || hex === hex.toUpperCase()) {
      return true;
    }

    try {
      const checksummed = this.toChecksumAddress(address);
      return address === checksummed;
    } catch {
      return false;
    }
  }

  /**
   * Check if string is a valid Ethereum address format
   *
   * Validates basic address format without checksum verification.
   * Checks length, hex characters, and 0x prefix.
   *
   * ## Validation:
   * - Must start with "0x"
   * - Must be exactly 42 characters (0x + 40 hex chars)
   * - Must contain only hex characters (0-9, a-f, A-F)
   *
   * ## Does NOT validate:
   * - Checksum correctness (use isValidChecksumAddress)
   * - Whether address exists on-chain
   * - Whether address is zero address
   *
   * @param address - String to validate as Ethereum address
   * @returns true if valid address format, false otherwise
   *
   * @example
   * ```typescript
   * // Valid address
   * console.log(Encoding.isValidAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")); // true
   *
   * // Invalid: no 0x prefix
   * console.log(Encoding.isValidAddress("742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")); // false
   *
   * // Invalid: wrong length
   * console.log(Encoding.isValidAddress("0x742d35")); // false
   *
   * // Invalid: non-hex characters
   * console.log(Encoding.isValidAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbG")); // false
   * ```
   */
  static isValidAddress(address: string): boolean {
    if (!address.startsWith('0x')) {
      return false;
    }

    const hex = address.slice(2);
    if (hex.length !== 40) {
      return false;
    }

    return /^[0-9a-fA-F]{40}$/.test(hex);
  }

  /**
   * Convert Ethereum address string to byte array
   *
   * Converts hex address string to 20-byte Uint8Array.
   * Removes 0x prefix and validates format before conversion.
   *
   * @param address - Ethereum address (hex string with 0x prefix)
   * @returns 20-byte Uint8Array representing the address
   *
   * @throws {Error} If address is not 40 hex characters (20 bytes)
   * @throws {Error} If address contains invalid hex characters
   *
   * @example
   * ```typescript
   * // Convert address for contract calls
   * const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
   * const bytes = Encoding.addressToBytes(address);
   * console.log(bytes.length); // 20
   *
   * // Use in ECDH or comparisons
   * const isMatch = Bytes.equalBytes(bytes, stealthAddress);
   * ```
   */
  static addressToBytes(address: string): Uint8Array {
    const cleanHex = address.toLowerCase().replace('0x', '');

    if (cleanHex.length !== 40) {
      throw new Error('Invalid address length');
    }

    if (!/^[0-9a-fA-F]{40}$/.test(cleanHex)) {
      throw new Error('Invalid hex characters in address');
    }

    return Bytes.hexToBytes('0x' + cleanHex);
  }

  /**
   * Convert byte array to checksummed Ethereum address string
   *
   * Converts 20-byte array to EIP-55 checksummed address string.
   * Automatically applies checksum encoding.
   *
   * @param bytes - 20-byte address
   * @returns EIP-55 checksummed address with 0x prefix
   *
   * @throws {Error} If bytes are not exactly 20 bytes
   *
   * @example
   * ```typescript
   * // Convert stealth address to string
   * const stealthAddr = Address.deriveStealthAddress(spendPub, sharedSecret);
   * const addressString = Encoding.bytesToAddress(stealthAddr);
   * console.log(addressString); // "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
   *
   * // Send payment to checksummed address
   * await contract.sendPayment(addressString, amount);
   * ```
   */
  static bytesToAddress(bytes: Uint8Array): string {
    if (bytes.length !== 20) {
      throw new Error('Address must be 20 bytes');
    }

    return this.toChecksumAddress(bytes);
  }

  /**
   * Encode data for IndexedDB storage
   *
   * Serializes data to JSON, encodes as UTF-8 bytes, then Base64.
   * Suitable for storing complex objects in IndexedDB.
   *
   * ## Process:
   * 1. JSON.stringify(data)
   * 2. Convert to UTF-8 bytes
   * 3. Encode as Base64
   *
   * ## Use Cases:
   * - Store user settings in IndexedDB
   * - Cache API responses
   * - Save non-sensitive configuration
   *
   * ## Note:
   * For sensitive data, use Encryption.encryptJson instead.
   *
   * @param data - Any JSON-serializable data
   * @returns Base64 encoded string
   *
   * @example
   * ```typescript
   * // Save user settings
   * const settings = {
   *   theme: "dark",
   *   language: "en",
   *   notifications: true
   * };
   *
   * const encoded = Encoding.encodeStorageData(settings);
   * await db.put('settings', encoded);
   *
   * // Load settings
   * const stored = await db.get('settings');
   * const decoded = Encoding.decodeStorageData(stored);
   * console.log(decoded.theme); // "dark"
   * ```
   */
  static encodeStorageData(data: unknown): string {
    const json = JSON.stringify(data);
    const bytes = Bytes.stringToBytes(json);
    return Bytes.bytesToBase64(bytes);
  }

  /**
   * Decode data from IndexedDB storage
   *
   * Decodes Base64 string, converts to UTF-8, then parses JSON.
   * Reverses the encodeStorageData operation.
   *
   * @param encoded - Base64 encoded string from storage
   * @returns Decoded data (type depends on what was encoded)
   *
   * @throws {Error} If Base64 decoding fails
   * @throws {Error} If JSON parsing fails
   *
   * @example
   * ```typescript
   * // Load and decode settings
   * const stored = await db.get('settings');
   * const settings = Encoding.decodeStorageData(stored) as {
   *   theme: string;
   *   language: string;
   *   notifications: boolean;
   * };
   *
   * console.log(settings.theme); // "dark"
   * ```
   */
  static decodeStorageData(encoded: string): unknown {
    try {
      const bytes = Bytes.base64ToBytes(encoded);
      const json = Bytes.bytesToString(bytes);
      return JSON.parse(json);
    } catch (error) {
      throw new Error(`Failed to decode storage data : ${(error as Error).message}`);
    }
  }

  /**
   * Encode BigInt to hexadecimal string
   *
   * Converts BigInt to 0x-prefixed hex string.
   * Useful for contract interactions and large number serialization.
   *
   * @param value - BigInt value to encode
   * @returns Hexadecimal string with 0x prefix
   *
   * @example
   * ```typescript
   * // Encode token amount (1 IDRX = 1e18 wei)
   * const amount = 1000000000000000000n;
   * const hex = Encoding.encodeBigInt(amount);
   * console.log(hex); // "0xde0b6b3a7640000"
   *
   * // Send to contract
   * await contract.transfer(recipient, hex);
   * ```
   */
  static encodeBigInt(value: bigint): string {
    return '0x' + value.toString(16);
  }

  /**
   * Decode hexadecimal string to BigInt
   *
   * Converts 0x-prefixed hex string to BigInt.
   * Useful for parsing contract return values.
   *
   * @param hex - Hexadecimal string with 0x prefix
   * @returns BigInt value
   *
   * @throws {Error} If hex string doesn't start with 0x
   * @throws {Error} If hex contains invalid characters
   *
   * @example
   * ```typescript
   * // Parse balance from contract
   * const hexBalance = await contract.balanceOf(address);
   * const balance = Encoding.decodeBigInt(hexBalance);
   * console.log(balance); // 1000000000000000000n
   *
   * // Convert to human-readable
   * const idrx = Number(balance) / 1e18;
   * console.log(idrx); // 1.0
   * ```
   */
  static decodeBigInt(hex: string): bigint {
    if (!hex.startsWith('0x')) {
      throw new Error('Hex string must start with 0x');
    }

    const cleanHex = hex.slice(2);
    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
      throw new Error('Invalid hex characters');
    }

    return BigInt(hex);
  }

  /**
   * Pad hexadecimal string to specified length
   *
   * Left-pads hex string with zeros to reach target length.
   * Useful for formatting contract parameters.
   *
   * @param hex - Hexadecimal string (with or without 0x prefix)
   * @param length - Target length in hex characters (not bytes)
   * @returns Padded hex string with 0x prefix
   *
   * @example
   * ```typescript
   * // Pad address to 64 hex chars (32 bytes) for contract ABI
   * const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
   * const padded = Encoding.padHex(address.slice(2), 64);
   * console.log(padded); // "0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
   *
   * // Pad number to 64 hex chars
   * const num = "0x1234";
   * const paddedNum = Encoding.padHex(num, 64);
   * console.log(paddedNum); // "0x0000...1234"
   * ```
   */
  static padHex(hex: string, length: number): string {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    return '0x' + cleanHex.padStart(length, '0');
  }

  /**
   * Convert number or BigInt to byte array
   *
   * Encodes number as big-endian bytes with specified length.
   * Default length is 32 bytes (uint256 for Ethereum contracts).
   *
   * @param num - Number or BigInt to convert
   * @param length - Target byte length (default: 32)
   * @returns Byte array containing encoded number
   *
   * @throws {Error} If number is too large for specified length
   *
   * @example
   * ```typescript
   * // Encode uint256 for contract (32 bytes)
   * const amount = 1000000000000000000n;
   * const bytes = Encoding.numberToBytes(amount, 32);
   * console.log(bytes.length); // 32
   *
   * // Encode smaller number (8 bytes)
   * const timestamp = Date.now();
   * const timeBytes = Encoding.numberToBytes(timestamp, 8);
   * ```
   */
  static numberToBytes(num: number | bigint, length: number = 32): Uint8Array {
    const bigIntNum = typeof num === 'bigint' ? num : BigInt(num);
    const hex = bigIntNum.toString(16).padStart(length * 2, '0');

    if (hex.length > length * 2) {
      throw new Error(`Number too large for ${length} bytes`);
    }
    return Bytes.hexToBytes('0x' + hex);
  }

  /**
   * Convert byte array to BigInt number
   *
   * Decodes big-endian byte array to BigInt.
   * Inverse of numberToBytes().
   *
   * @param bytes - Byte array to convert
   * @returns BigInt value decoded from bytes
   *
   * @example
   * ```typescript
   * // Decode uint256 from contract
   * const balanceBytes = await contract.getRawBalance(address);
   * const balance = Encoding.bytesToNumber(balanceBytes);
   * console.log(balance); // 1000000000000000000n
   *
   * // Decode timestamp
   * const timeBytes = new Uint8Array(8);
   * const timestamp = Encoding.bytesToNumber(timeBytes);
   * ```
   */
  static bytesToNumber(bytes: Uint8Array): bigint {
    return BigInt('0x' + Bytes.bytesToHex(bytes, false));
  }
}
