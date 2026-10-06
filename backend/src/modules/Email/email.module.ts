import { ResendEmailProvider } from './infrastructure/resend-email.provider.js';
import { PrismaOtpRepository } from '../Otp/infrastructure/prisma-otp.repository.js';
import { auditRepository } from '../Audit/audit.module.js';
import { SendVerificationEmailUseCase } from './application/send-verification-email.usecase.js';
import { SendCustomEmailUseCase } from './application/send-custom-email.usecase.js';
import { EmailController } from './presentation/email.controller.js';

// Providers & Repositories
export const emailProvider = new ResendEmailProvider();
export const otpRepository = new PrismaOtpRepository();

// Use Cases
export const sendVerificationEmailUseCase = new SendVerificationEmailUseCase(
  otpRepository,
  emailProvider,
  auditRepository
);

export const sendCustomEmailUseCase = new SendCustomEmailUseCase(
  emailProvider,
  auditRepository
);

// Controllers
export const emailController = new EmailController(
  sendVerificationEmailUseCase,
  sendCustomEmailUseCase
);
