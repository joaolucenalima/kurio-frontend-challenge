import { httpClient } from '#/shared/api/http'
import type { CheckoutQuote, Order, CheckoutInput, CheckoutWallet } from './model'

export const checkoutApi = {
  quote: async (signal?: AbortSignal) =>
    (await httpClient.get<CheckoutQuote>('/cart/quote', { signal })).data,
  connect: async (walletId: string, application: string, wallet?: CheckoutWallet) =>
    (
      await httpClient.post<{ walletId: string; connected: boolean }>('/wallets/connect', {
        walletId,
        application,
        temporaryWallet: wallet?.temporary ? wallet : undefined,
      })
    ).data,
  disconnect: async (walletId: string) =>
    (
      await httpClient.post<{ walletId: string; connected: boolean }>('/wallets/disconnect', {
        walletId,
      })
    ).data,
  createOrder: async (input: {
    idempotencyKey: string
    quoteId: string
    collector: CheckoutInput
    wallets: CheckoutWallet[]
  }) =>
    (
      await httpClient.post<Order>('/orders', input, {
        headers: { 'Idempotency-Key': input.idempotencyKey },
      })
    ).data,
  getOrder: async (id: string, signal?: AbortSignal) =>
    (await httpClient.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })).data,
  getByAttempt: async (key: string, signal?: AbortSignal) =>
    (await httpClient.get<Order>(`/orders/attempt/${encodeURIComponent(key)}`, { signal })).data,
}
