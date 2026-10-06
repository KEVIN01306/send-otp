import { z } from 'zod';

export const SendVerificationEmailSchema = z.object({
  email: z.string().trim().email('Formato de correo electrónico inválido'),
  redirectUrl: z.string().trim().url('El redirectUrl debe ser una URL válida con protocolo http:// o https://'),
});

export const SendCustomEmailSchema = z.object({
  to: z.union([
    z.string().trim().email('Formato de correo electrónico inválido'),
    z.array(z.string().trim().email('Formato de correo electrónico inválido')).min(1, 'Debes incluir al menos un destinatario'),
  ]),
  subject: z.string().trim().min(1, 'El asunto es requerido').max(200),
  htmlContent: z.string().trim().min(1, 'El contenido HTML es requerido'),
  logoUrl: z.string().trim().url('El logoUrl debe ser una URL válida').optional(),
});

export type SendVerificationEmailDTO = z.infer<typeof SendVerificationEmailSchema>;
export type SendCustomEmailDTO = z.infer<typeof SendCustomEmailSchema>;
