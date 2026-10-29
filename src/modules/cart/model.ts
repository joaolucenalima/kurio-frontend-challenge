import type { Nft } from '#/modules/catalog'

export type CartLine = {
  nftId: string
  editionId: string
  quantity: number
  nft: Nft
  available: number
}
export type Cart = { items: CartLine[]; coupon: string | null }
export type Quote = {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: string | null
  valid: boolean
  id?: string
  version?: number
  expiresAt?: number
  networks?: string[]
}
export type CartInput = { nftId: string; editionId: string; quantity: number }
export const cartKey = (userId: string) => ['cart', userId] as const
export const quoteKey = (userId: string) => ['cart-quote', userId] as const
