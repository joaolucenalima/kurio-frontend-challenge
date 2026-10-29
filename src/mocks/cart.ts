import { http, HttpResponse } from 'msw'
import { ethToWei } from '#/modules/catalog'
import type { Cart, CartInput, Quote } from '#/modules/cart/model'
import { initialNfts, withScenarioPrice } from './fixtures'
import { authenticatedUser } from './session'
import { currentScenario } from './handlers'

const KEY = 'kurio.mock.carts.v1'
type Stored = Record<string, { items: CartInput[]; coupon: string | null }>

function read(): Stored {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Stored
  } catch {
    return {}
  }
}

function save(store: Stored) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function resetCarts() {
  localStorage.removeItem(KEY)
}

const fail = (message: string, status: number) => HttpResponse.json({ message }, { status })

function authorized(request: Request) {
  const user = authenticatedUser(request)
  return user ? user.id : null
}

function state(id: string) {
  return read()[id] || { items: [], coupon: null }
}

function output(id: string): Cart {
  const current = state(id)
  return {
    coupon: current.coupon,
    items: current.items.flatMap((line) => {
      const found = initialNfts.find((item) => item.id === line.nftId)
      const nft = found ? withScenarioPrice(found) : undefined
      if (!nft) return []
      return [
        {
          ...line,
          nft,
          available: nft.editions.find((item) => item.id === line.editionId)?.available || 0,
        },
      ]
    }),
  }
}

function update(id: string, next: Stored[string]) {
  const store = read()
  store[id] = next
  save(store)
  return HttpResponse.json(output(id))
}

function validLine(input: CartInput, previous = 0) {
  const nft = initialNfts.find((item) => item.id === input.nftId)
  if (!nft) return fail('NFT não encontrado', 404)
  const edition = nft.editions.find((item) => item.id === input.editionId)
  if (!edition) return fail('Edição não encontrada', 404)
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1)
    return fail('Quantidade inválida', 400)
  if (input.quantity + previous > edition.available)
    return fail('Disponibilidade insuficiente', 409)
  return null
}

const decimal = (wei: bigint) => {
  const whole = wei / 10n ** 18n
  const fraction = (wei % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}`
}

export function mockCartForUser(userId: string) {
  return output(userId)
}
export function consumeCartLines(
  userId: string,
  lines: Array<{ nftId: string; editionId: string; quantity: number }>,
) {
  const current = state(userId)
  const items = current.items.flatMap((line) => {
    const bought =
      lines.find((item) => item.nftId === line.nftId && item.editionId === line.editionId)
        ?.quantity || 0
    return line.quantity > bought ? [{ ...line, quantity: line.quantity - bought }] : []
  })
  const store = read()
  store[userId] = { ...current, items }
  save(store)
}
export function mockQuoteForUser(userId: string) {
  const cart = output(userId)
  const scenario = currentScenario()
  const valid =
    cart.items.every((line) => line.quantity <= line.available) && scenario !== 'stock-conflict'
  const subtotal = cart.items.reduce(
    (sum, line) => sum + ethToWei(line.nft.priceEth) * BigInt(line.quantity),
    0n,
  )
  const discount = cart.coupon === 'KURIO10' ? subtotal / 10n : 0n
  const fee = cart.items.length ? ethToWei('0.016') : 0n
  const changed = scenario === 'price-changed'
  const payableSubtotal = subtotal
  const payableDiscount = cart.coupon === 'KURIO10' ? payableSubtotal / 10n : discount
  const fingerprint =
    cart.items
      .map((line) => `${line.nftId}:${line.editionId}:${line.quantity}`)
      .sort()
      .join('|') + `:${cart.coupon || ''}`
  let hash = 0
  for (const character of fingerprint) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0
  return {
    subtotalEth: decimal(payableSubtotal),
    discountEth: decimal(payableDiscount),
    networkFeeEth: decimal(fee),
    totalEth: decimal(payableSubtotal - payableDiscount + fee),
    coupon: cart.coupon,
    valid,
    id: `quote-${userId}-${changed ? 2 : 1}-${Math.abs(hash)}`,
    version: changed ? 2 : 1,
    expiresAt: Date.now() + 60_000,
    networks: [...new Set(cart.items.map((line) => line.nft.network))],
  }
}

export const cartHandlers = [
  http.get('/api/cart', ({ request }) => {
    const id = authorized(request)
    return id ? HttpResponse.json(output(id)) : fail('Sessão inválida', 401)
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const id = authorized(request)
    if (!id) return fail('Sessão inválida', 401)
    const input = (await request.json()) as CartInput
    const current = state(id)
    const previous = current.items.find(
      (item) => item.nftId === input.nftId && item.editionId === input.editionId,
    )
    const problem = validLine(input, previous?.quantity || 0)
    if (problem) return problem
    const items = previous
      ? current.items.map((item) =>
          item === previous ? { ...item, quantity: item.quantity + input.quantity } : item,
        )
      : [...current.items, input]
    return update(id, { ...current, items })
  }),

  http.put('/api/cart/items/:nftId/:editionId', async ({ request, params }) => {
    const id = authorized(request)
    if (!id) return fail('Sessão inválida', 401)
    const current = state(id)
    const old = current.items.find(
      (item) => item.nftId === params.nftId && item.editionId === params.editionId,
    )
    if (!old) return fail('Item não encontrado', 404)
    const body = (await request.json()) as { quantity: number }
    const input = { ...old, quantity: body.quantity }
    const problem = validLine(input)
    if (problem) return problem
    return update(id, {
      ...current,
      items: current.items.map((item) => (item === old ? input : item)),
    })
  }),

  http.delete('/api/cart/items/:nftId/:editionId', ({ request, params }) => {
    const id = authorized(request)
    if (!id) return fail('Sessão inválida', 401)
    const current = state(id)
    return update(id, {
      ...current,
      items: current.items.filter(
        (item) => item.nftId !== params.nftId || item.editionId !== params.editionId,
      ),
    })
  }),

  http.put('/api/cart/coupon', async ({ request }) => {
    const id = authorized(request)
    if (!id) return fail('Sessão inválida', 401)
    const { code } = (await request.json()) as { code: string | null }
    const normalized = code?.trim().toUpperCase() || null
    if (normalized === 'EXPIRED') return fail('Cupom expirado', 422)
    if (normalized && normalized !== 'KURIO10') return fail('Cupom inválido', 422)
    return update(id, { ...state(id), coupon: normalized })
  }),

  http.get('/api/cart/quote', ({ request }) => {
    const id = authorized(request)
    if (!id) return fail('Sessão inválida', 401)
    return HttpResponse.json(mockQuoteForUser(id) satisfies Quote)
  }),
]
