import type { Order } from '#/modules/checkout/model'

export function couponProblem(userId: string, code: string | null) {
  if (!code) return null
  const orders = JSON.parse(localStorage.getItem('kurio.mock.orders.v1') || '{}') as Record<
    string,
    Order & { owner: string }
  >
  const matching = Object.values(orders).filter(
    (order) => order.owner === userId && order.snapshot.quote.coupon === code,
  )
  if (matching.some((order) => order.status === 'confirmed'))
    return 'Cupom já utilizado por este usuário'
  if (matching.some((order) => order.status === 'pending'))
    return 'Cupom reservado em um pedido em processamento'
  return null
}
