import { describe, it, expect } from 'vitest';
import { MockEmailProvider } from '../../src/modules/Email/infrastructure/mock-email.provider.js';
import { ResendEmailProvider } from '../../src/modules/Email/infrastructure/resend-email.provider.js';

describe('Email Providers', () => {
  describe('MockEmailProvider', () => {
    it('should successfully send OTP email and record in sentEmails', async () => {
      const mockProvider = new MockEmailProvider();
      const result = await mockProvider.sendOtpEmail('test@example.com', '123456', 10, 'TestProject');

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockProvider.sentEmails).toHaveLength(1);
      expect(mockProvider.sentEmails[0].to).toBe('test@example.com');
      expect(mockProvider.sentEmails[0].text).toContain('123456');
    });

    it('should handle simulated failure', async () => {
      const mockProvider = new MockEmailProvider();
      mockProvider.shouldFail = true;

      const result = await mockProvider.sendOtpEmail('test@example.com', '123456', 10);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Simulated email provider failure');
    });
  });

  describe('ResendEmailProvider Contract', () => {
    it('should implement IEmailProvider methods without errors', () => {
      const resendProvider = new ResendEmailProvider('re_dummy_test_key_123', 'noreply@test.dev');
      expect(typeof resendProvider.sendEmail).toBe('function');
      expect(typeof resendProvider.sendOtpEmail).toBe('function');
      expect(typeof resendProvider.sendVerificationEmail).toBe('function');
    });
  });
});
