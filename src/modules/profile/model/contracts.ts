import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição').max(60),
  username: z
    .string()
    .trim()
    .min(3, 'Use pelo menos 3 caracteres')
    .max(40)
    .regex(/^[\p{L}\p{N}._-]+$/u, 'Use letras, números, ponto, hífen ou sublinhado'),
  email: z.email('Informe um e-mail válido').transform((value) => value.trim().toLowerCase()),
  ensName: z
    .string()
    .trim()
    .max(63)
    .regex(/^[a-z0-9-]*$/, 'Use letras minúsculas, números e hífen')
    .optional()
    .or(z.literal('')),
  walletAlias: z.string().trim().min(2, 'Informe o apelido da carteira').max(40),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual'),
    newPassword: z.string().min(8, 'Use pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

export type Profile = z.infer<typeof profileSchema>
export type ProfileInput = z.input<typeof profileSchema>
export type PasswordChange = z.infer<typeof passwordChangeSchema>
