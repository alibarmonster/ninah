export class Validation {
  static validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.length === 0) {
      return { valid: false, error: 'Username cannot be empty' };
    }

    if (username.length > 32) {
      return { valid: false, error: 'Username too long (max 32 characters)' };
    }

    // Check if all characters are valid
    for (const char of username) {
      const isValid =
        (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char === '.' || char === '-' || char === '_';

      if (!isValid) {
        return {
          valid: false,
          error: 'Username must contain only lowercase letters, numbers, dot, hyphen, or underscore',
        };
      }
    }

    // Check first character
    const firstChar = username[0];
    const isFirstCharAlphanumeric = (firstChar >= 'a' && firstChar <= 'z') || (firstChar >= '0' && firstChar <= '9');

    if (!isFirstCharAlphanumeric) {
      return { valid: false, error: 'Username must start with a letter or number' };
    }

    // Check last character
    const lastChar = username[username.length - 1];
    const isLastCharAlphanumeric = (lastChar >= 'a' && lastChar <= 'z') || (lastChar >= '0' && lastChar <= '9');

    if (!isLastCharAlphanumeric) {
      return { valid: false, error: 'Username must end with a letter or number' };
    }

    // Check for consecutive special characters
    let prevWasSpecial = false;
    for (const char of username) {
      const isSpecial = char === '.' || char === '-' || char === '_';
      if (isSpecial && prevWasSpecial) {
        return { valid: false, error: 'Username cannot have consecutive special characters' };
      }
      prevWasSpecial = isSpecial;
    }

    return { valid: true };
  }

  static isValidLength(username: string): boolean {
    return username.length > 0 && username.length <= 32;
  }

  static isValidCharacters(username: string): boolean {
    for (const char of username) {
      const isValid =
        (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char === '.' || char === '-' || char === '_';

      if (!isValid) {
        return false;
      }
    }
    return true;
  }

  static isValidFormat(username: string): boolean {
    if (!username || username.length === 0) {
      return false;
    }

    // Check first character is alphanumeric
    const firstChar = username[0];
    const isFirstCharAlphanumeric = (firstChar >= 'a' && firstChar <= 'z') || (firstChar >= '0' && firstChar <= '9');

    if (!isFirstCharAlphanumeric) {
      return false;
    }

    // Check last character is alphanumeric
    const lastChar = username[username.length - 1];
    const isLastCharAlphanumeric = (lastChar >= 'a' && lastChar <= 'z') || (lastChar >= '0' && lastChar <= '9');

    if (!isLastCharAlphanumeric) {
      return false;
    }

    // Check for consecutive special characters
    let prevWasSpecial = false;
    for (const char of username) {
      const isSpecial = char === '.' || char === '-' || char === '_';
      if (isSpecial && prevWasSpecial) {
        return false;
      }
      prevWasSpecial = isSpecial;
    }

    return true;
  }

  static sanitizeUsername(input: string): string {
    // Convert to lowercase
    let sanitized = input.toLowerCase();

    // Remove any characters that are not allowed
    sanitized = sanitized.replace(/[^a-z0-9.\-_]/g, '');

    // Remove consecutive special characters
    sanitized = sanitized.replace(/([.\-_]){2,}/g, '$1');

    // Ensure it starts with alphanumeric
    sanitized = sanitized.replace(/^[^a-z0-9]+/, '');

    // Ensure it ends with alphanumeric
    sanitized = sanitized.replace(/[^a-z0-9]+$/, '');

    // Truncate to max length
    if (sanitized.length > 32) {
      sanitized = sanitized.substring(0, 32);
      // Re-ensure it ends with alphanumeric after truncation
      sanitized = sanitized.replace(/[^a-z0-9]+$/, '');
    }

    return sanitized;
  }
}
