import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  keyName: z.string().trim().min(2, 'El nombre de la clave debe tener al menos 2 caracteres').max(100),
  description: z.string().trim().optional(),
});

export const RevokeApiKeySchema = z.object({
  apiKeyId: z.string().trim().uuid('apiKeyId debe ser un UUID válido'),
});

export const SetProjectStatusSchema = z.object({
  isActive: z.boolean({ message: 'isActive es requerido (true o false)' }),
});

export type CreateProjectInputDTO = z.infer<typeof CreateProjectSchema>;
export type RevokeApiKeyInputDTO = z.infer<typeof RevokeApiKeySchema>;
export type SetProjectStatusInputDTO = z.infer<typeof SetProjectStatusSchema>;
