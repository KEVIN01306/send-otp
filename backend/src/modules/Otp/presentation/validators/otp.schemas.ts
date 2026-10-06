import { z } from 'zod';
import { TokenType } from '@prisma/client';

export const SendOtpSchema = z.object({
  email: z.string().trim().email('Formato de correo electrónico inválido'),
  type: z.nativeEnum(TokenType).optional().default(TokenType.OTP),
});

export const VerifyOtpSchema = z.object({
  email: z.string().trim().email('Formato de correo electrónico inválido'),
  code: z.string().trim().regex(/^\d{6}$/, 'El código debe ser exactamente de 6 dígitos numéricos'),
  type: z.nativeEnum(TokenType).optional().default(TokenType.OTP),
});

export type SendOtpDTO = z.infer<typeof SendOtpSchema>;
export type VerifyOtpDTO = z.infer<typeof VerifyOtpSchema>;
