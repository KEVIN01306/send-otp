export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Domain interface / Contract for Email Providers.
 * This decouples the application from concrete implementations like Resend, SendGrid, AWS SES, etc.
 */
export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  sendOtpEmail(email: string, otpCode: string, expirationMinutes: number, projectName?: string, logoUrl?: string): Promise<SendEmailResult>;
  sendVerificationEmail(email: string, verificationUrl: string, projectName?: string, logoUrl?: string): Promise<SendEmailResult>;
  sendCustomEmail(to: string | string[], subject: string, htmlContent: string, projectName?: string, logoUrl?: string): Promise<SendEmailResult>;
}
