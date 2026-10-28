import { queryOptions } from '@tanstack/react-query'
import { httpClient } from '#/shared/api/http'
import { parseCatalogResponse } from '../model/contracts'
import type { CatalogSearch, Nft } from '../model/contracts'

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
        (await httpClient.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
      staleTime: 30_000,
    }),
}
