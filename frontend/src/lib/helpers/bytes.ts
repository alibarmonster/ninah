/**
 * Bytes utility class for hex/bytes conversion
 */
export class Bytes {
  /**
   * Convert Uint8Array to hex string with 0x prefix
   */
  static bytesToHex(bytes: Uint8Array): `0x${string}` {
    return `0x${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}` as `0x${string}`;
  }

  /**
   * Convert hex string to Uint8Array
   */
  static hexToBytes(hex: `0x${string}`): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  /**
   * Generate random bytes
   */
  static randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Compare two byte arrays for equality
   */
  static equals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
