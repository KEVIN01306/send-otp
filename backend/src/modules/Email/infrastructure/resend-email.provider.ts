import { Resend } from 'resend';
import { IEmailProvider, SendEmailOptions, SendEmailResult } from '../domain/email.provider.js';
import { getOtpEmailTemplate, getVerificationEmailTemplate, getCustomEmailTemplate } from './templates/email.templates.js';
import { config } from '../../../shared/config/env.config.js';
import { Logger } from '../../../shared/logger/logger.js';

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(apiKey?: string, fromEmail?: string) {
    const key = apiKey || config.resendApiKey;
    this.fromEmail = fromEmail || config.emailFrom;

    if (key) {
      this.resend = new Resend(key);
    } else {
      Logger.warn('ResendEmailProvider initialized without RESEND_API_KEY. Emails will not be sent via Resend.');
    }
  }

  public async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.resend) {
      Logger.warn('Resend client not configured. Skipping email dispatch.', { to: options.to, subject: options.subject });
      return {
        success: false,
        error: 'Email provider not configured with valid API key',
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (response.error) {
        Logger.error('Resend API returned an error', response.error, { to: options.to, subject: options.subject });
        return {
          success: false,
          error: response.error.message,
        };
      }

      Logger.info('Email sent successfully via Resend', {
        messageId: response.data?.id,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error: any) {
      Logger.error('Failed to send email via Resend', error, { to: options.to, subject: options.subject });
      return {
        success: false,
        error: error?.message || 'Unknown error sending email',
      };
    }
  }

  public async sendOtpEmail(
    email: string,
    otpCode: string,
    expirationMinutes: number,
    projectName: string = 'Autenticación',
    logoUrl?: string
  ): Promise<SendEmailResult> {
    const template = getOtpEmailTemplate({
      otpCode,
      expirationMinutes,
      projectName,
      logoUrl,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  public async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    projectName: string = 'Servicio de Autenticación',
    logoUrl?: string
  ): Promise<SendEmailResult> {
    const template = getVerificationEmailTemplate({
      verificationUrl,
      projectName,
      logoUrl,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  public async sendCustomEmail(
    to: string | string[],
    subject: string,
    htmlContent: string,
    projectName: string = 'Notificación',
    logoUrl?: string
  ): Promise<SendEmailResult> {
    const template = getCustomEmailTemplate({
      htmlContent,
      subject,
      projectName,
      logoUrl,
    });

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}
