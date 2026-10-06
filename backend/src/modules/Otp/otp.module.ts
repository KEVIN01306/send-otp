import { PrismaOtpRepository } from './infrastructure/prisma-otp.repository.js';
import { emailProvider } from '../Email/email.module.js';
import { auditRepository } from '../Audit/audit.module.js';
import { SendOtpUseCase } from './application/send-otp.usecase.js';
import { VerifyOtpUseCase } from './application/verify-otp.usecase.js';
import { OtpController } from './presentation/otp.controller.js';

// Repositories
export const otpRepository = new PrismaOtpRepository();

// Use Cases
export const sendOtpUseCase = new SendOtpUseCase(otpRepository, emailProvider, auditRepository);
export const verifyOtpUseCase = new VerifyOtpUseCase(otpRepository, auditRepository);

// Controllers
export const otpController = new OtpController(sendOtpUseCase, verifyOtpUseCase);
