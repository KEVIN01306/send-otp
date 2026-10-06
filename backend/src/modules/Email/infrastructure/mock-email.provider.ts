import { IEmailProvider, SendEmailOptions, SendEmailResult } from '../domain/email.provider.js';
import { Logger } from '../../../shared/logger/logger.js';

export class MockEmailProvider implements IEmailProvider {
  public sentEmails: SendEmailOptions[] = [];
  public shouldFail: boolean = false;

  public async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (this.shouldFail) {
      return {
        success: false,
        error: 'Simulated email provider failure',
      };
    }

    this.sentEmails.push(options);
    Logger.info('[MOCK EMAIL] Email recorded in memory', {
      to: options.to,
      subject: options.subject,
    });

    return {
      success: true,
      messageId: `mock-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
  }

  public async sendOtpEmail(
    email: string,
    otpCode: string,
    expirationMinutes: number,
    projectName: string = 'MockProject'
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Código OTP - ${projectName}`,
      html: `<p>OTP: ${otpCode}</p>`,
      text: `OTP: ${otpCode}`,
    });
  }

  public async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    projectName: string = 'MockProject'
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Verificación - ${projectName}`,
      html: `<a href="${verificationUrl}">Verificar</a>`,
      text: verificationUrl,
    });
  }

  public async sendCustomEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    projectName: string = 'MockProject'
  ): Promise<SendEmailResult> {
    return this.sendEmail({
      to,
      subject,
      html: `<div>${htmlContent}</div>`,
      text: htmlContent,
    });
  }
}
