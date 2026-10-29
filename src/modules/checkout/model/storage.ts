import { z } from 'zod'
import { checkoutSchema, type CheckoutAttempt, type CheckoutInput } from '../model'
import { walletKinds, walletNetworks } from '#/modules/wallets'

const attemptSchema = z.object({
  idempotencyKey: z.string().min(1),
  quoteId: z.string().min(1),
  collector: checkoutSchema,
  wallets: z.array(
    z.object({
      id: z.string(),
      alias: z.string(),
      network: z.enum(walletNetworks),
      address: z.string(),
      ensName: z.string().optional(),
      kind: z.enum(walletKinds),
      temporary: z.boolean().optional(),
    }),
  ),
})

const draftSchema = z.object({
  email: z.string().max(320),
  note: z.string().max(500),
})

export const checkoutStorage = {
  readDraft(key: string): CheckoutInput | null {
    try {
      const parsed = draftSchema.safeParse(JSON.parse(localStorage.getItem(key) || 'null'))
      if (!parsed.success && localStorage.getItem(key)) localStorage.removeItem(key)
      return parsed.success ? parsed.data : null
    } catch {
      localStorage.removeItem(key)
      return null
    }
  },
  writeDraft(key: string, values: CheckoutInput) {
    const parsed = draftSchema.safeParse({ email: values.email, note: values.note })
    if (parsed.success) localStorage.setItem(key, JSON.stringify(parsed.data))
  },
  readAttempt(key: string): CheckoutAttempt | null {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) || 'null')
      const parsed = attemptSchema.safeParse(
        raw && typeof raw === 'object' && 'attempt' in raw ? raw.attempt : raw,
      )
      if (!parsed.success && localStorage.getItem(key)) localStorage.removeItem(key)
      return parsed.success ? parsed.data : null
    } catch {
      localStorage.removeItem(key)
      return null
    }
  },
  writeAttempt(key: string, attempt: CheckoutAttempt) {
    const parsed = attemptSchema.safeParse(attempt)
    if (parsed.success) localStorage.setItem(key, JSON.stringify({ attempt: parsed.data }))
  },
}
