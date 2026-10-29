import { couponProblem } from './coupon'
import { http, HttpResponse } from 'msw'
import { ethToWei } from '#/modules/catalog'
import type { Order } from '#/modules/checkout/model'
import { checkoutSchema } from '#/modules/checkout/model'
import { walletSchema, type Wallet } from '#/modules/wallets'
import { consumeCartLines, mockCartForUser, mockQuoteForUser } from './cart'
import { currentScenario } from './handlers'
import { accountProfile, authenticatedUser } from './session'

const ORDER_KEY = 'kurio.mock.orders.v1'
const TEMPORARY_KEY = 'kurio.mock.checkout-wallets.v1'
const temporaryStore = (): Record<string, Record<string, Order['snapshot']['wallets'][number]>> => {
  try {
    return JSON.parse(localStorage.getItem(TEMPORARY_KEY) || '{}')
  } catch {
    return {}
  }
}
const checkoutWallets = (userId: string) => [
  ...(walletStore().wallets?.[userId] || []),
  ...Object.values(temporaryStore()[userId] || {}),
]
const CONNECTED_KEY = 'kurio.mock.wallet-connections.v1'
const readOrders = (): Record<
  string,
  Order & { owner: string; fingerprint: string; consumed?: boolean }
> => {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY) || '{}')
  } catch {
    return {}
  }
}
const saveOrders = (orders: ReturnType<typeof readOrders>) =>
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders))
const fail = (message: string, status: number) => HttpResponse.json({ message }, { status })
const publicOrder = (order: ReturnType<typeof readOrders>[string]): Order => {
  const { owner: _owner, fingerprint: _fingerprint, consumed: _consumed, ...value } = order
  return value
}
const wei = (value: bigint) => {
  const fraction = (value % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
  return `${value / 10n ** 18n}${fraction ? `.${fraction}` : ''}`
}
const walletStore = () => {
  try {
    return JSON.parse(localStorage.getItem('kurio.mock.wallets.v1') || '{}') as {
      wallets?: Record<
        string,
        Array<{
          id: string
          network: Wallet['network']
          address: string
          alias: string
          ensName: string
          kind: Wallet['kind']
        }>
      >
    }
  } catch {
    return {}
  }
}
function walletMapHasNetwork(userId: string, walletId: string, network: string) {
  return (
    checkoutWallets(userId).some(
      (wallet) => wallet.id === walletId && wallet.network === network,
    ) || false
  )
}
function settle(
  order: Order & { owner: string; fingerprint: string; consumed?: boolean },
  status: 'confirmed' | 'declined',
) {
  order.status = status
  if (status === 'confirmed' && !order.consumed) {
    consumeCartLines(
      order.owner,
      order.snapshot.items.map(({ nftId, editionId, quantity }) => ({
        nftId,
        editionId,
        quantity,
      })),
    )
    order.consumed = true
    order.transactionReference = `0x${crypto.randomUUID().replaceAll('-', '')}`
  }
}

export const checkoutHandlers = [
  http.post('/api/wallets/connect', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const { walletId, application, temporaryWallet } = (await request.json()) as {
      walletId: string
      application: string
      temporaryWallet?: Order['snapshot']['wallets'][number]
    }
    if (!['metamask', 'coinbase'].includes(application))
      return fail('Selecione um aplicativo de carteira válido', 422)
    if (temporaryWallet) {
      const parsed = walletSchema.safeParse({ ...temporaryWallet, isPrimary: false })
      if (
        !parsed.success ||
        !temporaryWallet.temporary ||
        temporaryWallet.id !== walletId ||
        !walletId.startsWith('temporary:' + user.id + ':')
      )
        return fail('Dados da carteira desta compra inválidos', 422)
      const store = temporaryStore()
      store[user.id] = {
        ...store[user.id],
        [walletId]: { ...parsed.data, id: walletId, temporary: true },
      }
      localStorage.setItem(TEMPORARY_KEY, JSON.stringify(store))
    }
    const wallet = checkoutWallets(user.id).find(({ id }) => id === walletId)
    if (!wallet) return fail('Carteira não encontrada', 404)
    if (currentScenario() === 'payment-error')
      return fail('A conexão foi recusada pela carteira.', 422)
    const connected = JSON.parse(localStorage.getItem(CONNECTED_KEY) || '{}') as Record<
      string,
      string[]
    >
    connected[user.id] = [...new Set([...(connected[user.id] || []), walletId])]
    localStorage.setItem(CONNECTED_KEY, JSON.stringify(connected))
    return HttpResponse.json({ walletId, connected: true })
  }),
  http.post('/api/wallets/disconnect', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const { walletId } = (await request.json()) as { walletId: string }
    const connected = JSON.parse(localStorage.getItem(CONNECTED_KEY) || '{}') as Record<
      string,
      string[]
    >
    connected[user.id] = (connected[user.id] || []).filter((id) => id !== walletId)
    localStorage.setItem(CONNECTED_KEY, JSON.stringify(connected))
    return HttpResponse.json({ walletId, connected: false })
  }),
  http.post('/api/orders', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const input = (await request.json()) as {
      idempotencyKey: string
      quoteId: string
      collector: Order['snapshot']['collector']
      wallets: Order['snapshot']['wallets']
    }
    const key = request.headers.get('Idempotency-Key') || input.idempotencyKey
    if (!key || key !== input.idempotencyKey) return fail('Chave de idempotência inválida', 400)
    const fingerprint = JSON.stringify({ ...input, idempotencyKey: undefined })
    const orders = readOrders()
    const existing = orders[key]
    if (existing) {
      if (existing.owner !== user.id || existing.fingerprint !== fingerprint)
        return fail('A chave já foi usada com outro conteúdo', 409)
      return HttpResponse.json(publicOrder(existing))
    }
    const collector = checkoutSchema.safeParse(input.collector)
    if (!collector.success)
      return fail(collector.error.issues[0]?.message || 'Dados do colecionador inválidos', 400)
    const profile = accountProfile(user.id)
    if (!profile) return fail('Perfil do colecionador não encontrado.', 404)
    if (currentScenario() === 'payment-error')
      return fail('Pagamento indisponível. Tente novamente.', 503)
    const cart = mockCartForUser(user.id)
    const problem = couponProblem(user.id, cart.coupon)
    if (problem) return fail(problem, 409)
    const quote = mockQuoteForUser(user.id)
    if (!cart.items.length) return fail('Seu carrinho está vazio', 409)
    if (input.quoteId !== quote.id || Date.now() > quote.expiresAt || !quote.valid)
      return fail('Cotação desatualizada ou disponibilidade insuficiente', 409)
    const connected = JSON.parse(localStorage.getItem(CONNECTED_KEY) || '{}') as Record<
      string,
      string[]
    >
    const connectedIds = connected[user.id] || []
    const missing = quote.networks.some(
      (network) =>
        !input.wallets.some(
          (wallet) =>
            wallet.network === network &&
            connectedIds.includes(wallet.id) &&
            walletMapHasNetwork(user.id, wallet.id, network),
        ),
    )
    if (missing) return fail('Conecte uma carteira compatível para cada rede dos NFTs.', 422)
    const walletMap = checkoutWallets(user.id)
    if (
      input.wallets.some(
        (selection) =>
          !walletMap.some(
            (wallet) =>
              wallet.id === selection.id &&
              wallet.network === selection.network &&
              (!selection.temporary || wallet.address === selection.address),
          ),
      )
    )
      return fail('Seleção de carteira inválida.', 422)
    const snapshotItems = cart.items.map((line) => {
      const edition = line.nft.editions.find(({ id }) => id === line.editionId)
      const total = ethToWei(line.nft.priceEth) * BigInt(line.quantity)
      return {
        nftId: line.nftId,
        name: line.nft.name,
        editionId: line.editionId,
        editionName: edition?.name || line.editionId,
        image: line.nft.displayImageUrl,
        quantity: line.quantity,
        priceEth: line.nft.priceEth,
        lineTotalEth: wei(total),
      }
    })
    const snapshotQuote = { ...quote }
    const order: Order & { owner: string; fingerprint: string; consumed?: boolean } = {
      id: crypto.randomUUID(),
      idempotencyKey: key,
      status: 'pending',
      createdAt: Date.now(),
      snapshot: {
        collector: {
          ...input.collector,
          displayName: profile.displayName,
          username: user.username,
        },
        wallets: input.wallets.map((selection) => {
          const wallet = walletMap.find(({ id }) => id === selection.id)!
          return {
            id: wallet.id,
            network: wallet.network,
            address: wallet.address,
            alias: wallet.alias,
            ensName: wallet.ensName,
            kind: wallet.kind,
            temporary: 'temporary' in wallet ? wallet.temporary : undefined,
          }
        }),
        items: snapshotItems,
        quote: snapshotQuote,
      },
      owner: user.id,
      fingerprint,
    }
    orders[key] = order
    saveOrders(orders)
    if (currentScenario() === 'timeout-after-create')
      return fail('Tempo esgotado após criação do pedido. Recupere a tentativa.', 504)
    if (currentScenario() === 'payment-success') settle(order, 'confirmed')
    if (currentScenario() === 'payment-declined') settle(order, 'declined')
    saveOrders(orders)
    return HttpResponse.json(publicOrder(order), { status: 201 })
  }),
  http.get('/api/orders/attempt/:key', ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const order = readOrders()[String(params.key)]
    return order?.owner === user.id
      ? HttpResponse.json(publicOrder(order))
      : fail('Pedido não encontrado', 404)
  }),
  http.get('/api/orders/:id', ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const orders = readOrders()
    const order = Object.values(orders).find(
      (item) => item.id === params.id && item.owner === user.id,
    )
    if (!order) return fail('Pedido não encontrado', 404)
    if (order.status === 'pending' && currentScenario() !== 'payment-pending')
      settle(order, currentScenario() === 'payment-declined' ? 'declined' : 'confirmed')
    saveOrders(orders)
    return HttpResponse.json(publicOrder(order))
  }),
]
