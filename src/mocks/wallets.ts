import { http, HttpResponse } from 'msw'
import { walletSchema, type Wallet, type WalletInput } from '#/modules/wallets/model'
import { authenticatedUser } from './session'

const STORE_KEY = 'kurio.mock.wallets.v1'
type StoredWallet = WalletInput & { id: string; version: number }
type Association = { userId: string; nftId: string; network: string; address: string }
type Store = {
  wallets: Record<string, StoredWallet[]>
  associations: Association[]
  initializedUsers: string[]
}

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '') as Store
  } catch {
    return { wallets: {}, associations: [], initializedUsers: [] }
  }
}

function write(store: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function ensureUserWallets(user: { id: string; username: string }) {
  const store = read()
  if (store.initializedUsers.includes(user.id)) return store
  const isAdmin = user.username.toLowerCase() === 'admin'
  const address = isAdmin
    ? '0x1111111111111111111111111111111111111111'
    : '0x2222222222222222222222222222222222222222'
  const main: StoredWallet = {
    id: crypto.randomUUID(),
    displayName: user.username,
    alias: 'Carteira principal',
    network: 'ethereum',
    address,
    ensName: '',
    kind: 'extension',
    isPrimary: true,
    version: 1,
  }
  store.wallets[user.id] = [main]
  if (isAdmin)
    store.associations.push({ userId: user.id, nftId: 'kurio-1', network: main.network, address })
  store.initializedUsers.push(user.id)
  write(store)
  return store
}

function nftCount(store: Store, userId: string, network: string, address: string) {
  return store.associations.filter(
    (item) => item.userId === userId && item.network === network && item.address === address,
  ).length
}

function list(userId: string, store = read()): Wallet[] {
  return (store.wallets[userId] || []).map((wallet) => ({
    ...wallet,
    nftCount: nftCount(store, userId, wallet.network, wallet.address),
  }))
}

function conflict(message: string) {
  return HttpResponse.json({ message, code: 'WALLET_CONFLICT' }, { status: 409 })
}

export function resetWallets() {
  localStorage.removeItem(STORE_KEY)
}

export function associateNftWithWallet(userId: string, walletId: string, nftId: string) {
  const store = read()
  const wallet = store.wallets[userId]?.find((item) => item.id === walletId)
  if (!wallet) return
  if (
    !store.associations.some(
      (item) =>
        item.userId === userId &&
        item.nftId === nftId &&
        item.network === wallet.network &&
        item.address === wallet.address,
    )
  )
    store.associations.push({ userId, nftId, network: wallet.network, address: wallet.address })
  write(store)
}

export const walletHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    return HttpResponse.json(list(user.id, ensureUserWallets(user)))
  }),

  http.post('/api/wallets', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    const parsed = walletSchema.safeParse(await request.json())
    if (!parsed.success)
      return HttpResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 })
    const store = ensureUserWallets(user)
    const input = parsed.data
    if (input.isPrimary && (store.wallets[user.id] || []).some((item) => item.isPrimary))
      return conflict(
        input.isPrimary ? 'Já existe uma carteira principal' : 'Já existe uma carteira secundária',
      )
    const wallet: StoredWallet = { ...input, id: crypto.randomUUID(), version: 1 }
    store.wallets[user.id] = [...(store.wallets[user.id] || []), wallet]
    write(store)
    return HttpResponse.json(
      {
        ...wallet,
        nftCount: nftCount(store, user.id, wallet.network, wallet.address),
      } satisfies Wallet,
      { status: 201 },
    )
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    const parsed = walletSchema.safeParse(await request.json())
    if (!parsed.success)
      return HttpResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 })
    const store = ensureUserWallets(user)
    const wallets = store.wallets[user.id] || []
    const index = wallets.findIndex((item) => item.id === params.id)
    if (index < 0) return HttpResponse.json({ message: 'Carteira não encontrada' }, { status: 404 })
    const current = wallets[index]!
    const next = parsed.data
    const associated = nftCount(store, user.id, current.network, current.address)
    if (associated > 0 && (next.network !== current.network || next.address !== current.address))
      return conflict(
        `Esta carteira está associada a ${associated} NFT${associated === 1 ? '' : 's'} e não pode trocar de rede ou endereço.`,
      )
    if (wallets.some((item, other) => other !== index && item.isPrimary === next.isPrimary))
      return conflict(
        next.isPrimary ? 'Já existe uma carteira principal' : 'Já existe uma carteira secundária',
      )
    const wallet: StoredWallet = { ...next, id: current.id, version: current.version + 1 }
    wallets[index] = wallet
    store.wallets[user.id] = wallets
    write(store)
    return HttpResponse.json({ ...wallet, nftCount: associated } satisfies Wallet)
  }),

  http.delete('/api/wallets/:id', ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    const store = ensureUserWallets(user)
    const wallets = store.wallets[user.id] || []
    const wallet = wallets.find((item) => item.id === params.id)
    if (!wallet) return HttpResponse.json({ message: 'Carteira não encontrada' }, { status: 404 })
    const count = nftCount(store, user.id, wallet.network, wallet.address)
    if (count > 0)
      return conflict(
        `Não é possível excluir esta carteira: ${count} NFT${count === 1 ? ' está associado' : 's estão associados'} a ela.`,
      )
    store.wallets[user.id] = wallets.filter((item) => item.id !== wallet.id)
    write(store)
    return new HttpResponse(null, { status: 204 })
  }),
]
