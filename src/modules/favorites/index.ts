import { httpClient } from '#/shared/api/http'
import { normalizeNft, type NftInput } from '#/modules/catalog/contracts'

import type { Favorites } from './contracts'

export type { Favorites } from './contracts'

export const favoritesKey = (userId: string) => ['favorites', userId] as const

export const favoritesApi = {
  list: async (signal?: AbortSignal): Promise<Favorites> =>
    (await httpClient.get<NftInput[]>('/favorites', { signal })).data.map(normalizeNft),
  add: async (nftId: string) => {
    await httpClient.put(`/favorites/${encodeURIComponent(nftId)}`)
  },
  remove: async (nftId: string) => {
    await httpClient.delete(`/favorites/${encodeURIComponent(nftId)}`)
  },
}

export { FavoriteButton } from './favorite-button'
export { FavoritesList } from './favorites-list'
