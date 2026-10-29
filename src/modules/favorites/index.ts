import { httpClient } from '#/shared/api/http'
import { normalizeNft, type Nft, type NftInput } from '#/modules/catalog'

export const favoritesKey = (userId: string) => ['favorites', userId] as const

export const favoritesApi = {
  list: async (signal?: AbortSignal): Promise<Nft[]> =>
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
