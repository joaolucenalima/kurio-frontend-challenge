import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido').transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, 'Informe sua senha'),
})

export const signupSchema = z
  .object({
    username: z.string().trim().min(3, 'Use pelo menos 3 caracteres').max(40),
    email: z.email('Informe um e-mail válido').transform((value) => value.trim().toLowerCase()),
    password: z.string().min(8, 'Use pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

export type SessionUser = { id: string; username: string; email: string }
export type Session = { token: string; user: SessionUser; expiresAt: number }
export type LoginInput = z.input<typeof loginSchema>
export type SignupInput = z.input<typeof signupSchema>

export const TOKEN_KEY = 'kurio.session.token.v1'
