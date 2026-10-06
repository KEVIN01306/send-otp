import { describe, it, expect } from 'vitest';
import { CryptoUtil } from '../../src/shared/utils/crypto.util.js';

describe('CryptoUtil', () => {
  it('should generate a secure API key starting with auth_live_', () => {
    const key = CryptoUtil.generateApiKey();
    expect(key).toMatch(/^auth_live_[a-f0-9]{48}$/);
  });

  it('should extract prefix correctly', () => {
    const key = 'auth_live_1234567890abcdef';
    const prefix = CryptoUtil.extractPrefix(key, 14);
    expect(prefix).toBe('auth_live_1234');
  });

  it('should generate a 6-digit numeric OTP code', () => {
    const otp = CryptoUtil.generateOtpCode(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should hash a string using SHA-256', () => {
    const hash1 = CryptoUtil.hashSha256('123456');
    const hash2 = CryptoUtil.hashSha256('123456');
    const hash3 = CryptoUtil.hashSha256('654321');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it('should safely compare strings in constant time', () => {
    const a = 'secret-value-123';
    const b = 'secret-value-123';
    const c = 'secret-value-456';
    const d = 'different-length';

    expect(CryptoUtil.safeTimingCompare(a, b)).toBe(true);
    expect(CryptoUtil.safeTimingCompare(a, c)).toBe(false);
    expect(CryptoUtil.safeTimingCompare(a, d)).toBe(false);
  });
});
