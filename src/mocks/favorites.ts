import { http, HttpResponse } from 'msw'
import { initialNfts } from './fixtures'
import { authenticatedUser } from './session'

const KEY = 'kurio.mock.favorites.v1'
type Store = Record<string, string[]>

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Store
  } catch {
    return {}
  }
}

export function resetFavorites() {
  localStorage.removeItem(KEY)
}

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    const ids = read()[user.id] || []
    return HttpResponse.json(ids.flatMap((id) => initialNfts.filter((nft) => nft.id === id)))
  }),
  http.put('/api/favorites/:id', ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    const nft = initialNfts.find((item) => item.id === params.id)
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado' }, { status: 404 })
    const store = read()
    store[user.id] = Array.from(new Set([...(store[user.id] || []), nft.id]))
    localStorage.setItem(KEY, JSON.stringify(store))
    return HttpResponse.json({ nftId: nft.id })
  }),
  http.delete('/api/favorites/:id', ({ request, params }) => {
    const user = authenticatedUser(request)
    if (!user) return HttpResponse.json({ message: 'Sessão inválida' }, { status: 401 })
    const store = read()
    store[user.id] = (store[user.id] || []).filter((id) => id !== params.id)
    localStorage.setItem(KEY, JSON.stringify(store))
    return new HttpResponse(null, { status: 204 })
  }),
]
