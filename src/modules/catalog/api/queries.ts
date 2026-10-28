import { queryOptions } from '@tanstack/react-query'
import { httpClient } from '#/shared/api/http'
import { normalizeNft, parseCatalogResponse, parseNftReviews } from '../model/contracts'
import type { CatalogSearch, NftInput } from '../model/contracts'

export const catalogQueries = {
  list: (search: CatalogSearch) =>
    queryOptions({
      queryKey: ['catalog', 'list', search],
      queryFn: async ({ signal }) =>
        parseCatalogResponse(
          (await httpClient.get<unknown>('/nfts', { params: search, signal })).data,
        ),
      staleTime: 30_000,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ['catalog', 'detail', id],
      queryFn: async ({ signal }) =>
        normalizeNft(
          (await httpClient.get<NftInput>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
        ),
      staleTime: 30_000,
    }),
  reviews: (id: string) =>
    queryOptions({
      queryKey: ['catalog', 'reviews', id],
      queryFn: async ({ signal }) =>
        parseNftReviews(
          (await httpClient.get<unknown>(`/nfts/${encodeURIComponent(id)}/reviews`, { signal }))
            .data,
        ),
      staleTime: 30_000,
    }),
  related: (id: string) =>
    queryOptions({
      queryKey: ['catalog', 'related', id],
      queryFn: async ({ signal }) =>
        (
          await httpClient.get<NftInput[]>(`/nfts/${encodeURIComponent(id)}/related`, { signal })
        ).data.map(normalizeNft),
      staleTime: 30_000,
    }),
}
