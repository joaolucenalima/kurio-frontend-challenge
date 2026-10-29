import { httpClient } from '#/shared/api/http'
import type { Cart, CartInput, Quote } from './model'

export const cartApi = {
  get: async ({ signal }: { signal?: AbortSignal } = {}) =>
    (await httpClient.get<Cart>('/cart', { signal })).data,
  quote: async ({ signal }: { signal?: AbortSignal } = {}) =>
    (await httpClient.get<Quote>('/cart/quote', { signal })).data,
  add: async (input: CartInput) => (await httpClient.post<Cart>('/cart/items', input)).data,
  setQuantity: async (input: CartInput) =>
    (
      await httpClient.put<Cart>(
        `/cart/items/${encodeURIComponent(input.nftId)}/${encodeURIComponent(input.editionId)}`,
        { quantity: input.quantity },
      )
    ).data,
  remove: async (input: Pick<CartInput, 'nftId' | 'editionId'>) =>
    (
      await httpClient.delete<Cart>(
        `/cart/items/${encodeURIComponent(input.nftId)}/${encodeURIComponent(input.editionId)}`,
      )
    ).data,
  coupon: async (code: string | null) =>
    (await httpClient.put<Cart>('/cart/coupon', { code })).data,
}
