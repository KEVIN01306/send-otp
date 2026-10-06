import crypto from 'node:crypto';

/**
 * Utility functions for cryptographic operations.
 * Never logs or exposes raw secrets.
 */
export class CryptoUtil {
  /**
   * Generates a cryptographically secure API key.
   * Format: auth_live_<48 hex chars>
   */
  public static generateApiKey(): string {
    const randomHex = crypto.randomBytes(24).toString('hex');
    return `auth_live_${randomHex}`;
  }

  /**
   * Extracts prefix for safe display and logging (first 14 chars by default, e.g. "auth_live_a1b2").
   */
  public static extractPrefix(rawApiKey: string, length: number = 14): string {
    const cleaned = rawApiKey.trim();
    return cleaned.slice(0, length);
  }

  /**
   * Generates a cryptographically secure numeric OTP code of specified length.
   * Default length: 6 digits (e.g. "481920").
   */
  public static generateOtpCode(length: number = 6): string {
    const max = Math.pow(10, length);
    const num = crypto.randomInt(0, max);
    return num.toString().padStart(length, '0');
  }

  /**
   * Computes SHA-256 hash of a string.
   */
  public static hashSha256(value: string): string {
    return crypto.createHash('sha256').update(value.trim()).digest('hex');
  }

  /**
   * Generates a random secure hex token (e.g. for email verification).
   */
  public static generateToken(byteLength: number = 32): string {
    return crypto.randomBytes(byteLength).toString('hex');
  }

  /**
   * Timing-safe equality check between two strings (e.g. hashes or master keys)
   * to protect against timing attacks.
   */
  public static safeTimingCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
      // Execute dummy comparison to maintain constant time profile
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }
}
