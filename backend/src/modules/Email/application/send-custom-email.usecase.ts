import { AuditAction } from '@prisma/client';
import { IEmailProvider } from '../domain/email.provider.js';
import { IAuditRepository } from '../../Audit/domain/audit.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { Logger } from '../../../shared/logger/logger.js';

export interface SendCustomEmailInput {
  projectId: string;
  projectName?: string;
  to: string | string[];
  subject: string;
  htmlContent: string;
  logoUrl?: string;
}

export interface SendCustomEmailOutput {
  success: boolean;
  message: string;
  messageId?: string;
}

export class SendCustomEmailUseCase {
  constructor(
    private emailProvider: IEmailProvider,
    private auditRepository: IAuditRepository
  ) {}

  public async execute(input: SendCustomEmailInput): Promise<SendCustomEmailOutput> {
    const emailResult = await this.emailProvider.sendCustomEmail(
      input.to,
      input.subject.trim(),
      input.htmlContent.trim(),
      input.projectName || 'Notificación',
      input.logoUrl
    );

    if (!emailResult.success) {
      Logger.error('Failed to send custom email', emailResult.error, {
        to: input.to,
        subject: input.subject,
        projectId: input.projectId,
      });
      throw new AppError(`Error al enviar el correo electrónico: ${emailResult.error}`, 'EMAIL_SEND_FAILED', 500);
    }

    // Record audit log
    await this.auditRepository.createLog({
      projectId: input.projectId,
      action: AuditAction.EMAIL_SENT,
      resource: 'custom_email',
      details: {
        to: input.to,
        subject: input.subject,
        messageId: emailResult.messageId,
      },
    });

    return {
      success: true,
      message: 'Correo enviado correctamente',
      messageId: emailResult.messageId,
    };
  }
}
