import { z } from 'zod'
import type { Quote } from '#/modules/cart/model'
import type { Wallet } from '#/modules/wallets'

export const checkoutSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  note: z.string().max(500, 'A observação pode ter até 500 caracteres'),
})
export type CheckoutInput = z.input<typeof checkoutSchema>
export type CollectorSnapshot = CheckoutInput & { displayName: string; username: string }
export type CheckoutWallet = Pick<
  Wallet,
  'id' | 'alias' | 'network' | 'address' | 'ensName' | 'kind'
> & { temporary?: boolean }
export type CheckoutQuote = Quote & {
  id: string
  version: number
  expiresAt: number
  networks: string[]
}
export type Order = {
  version: number
  id: string
  idempotencyKey: string
  status: 'pending' | 'confirmed' | 'declined'
  createdAt: number
  snapshot: {
    collector: CollectorSnapshot
    wallets: CheckoutWallet[]
    items: Array<{
      nftId: string
      name: string
      editionId: string
      editionName: string
      image: string
      quantity: number
      priceEth: string
      lineTotalEth: string
    }>
    quote: CheckoutQuote
  }
  transactionReference?: string
}

export const orderKey = (userId: string, id: string) => ['order', userId, id] as const
export const orderAttemptKey = (userId: string) => ['order-attempt', userId] as const
