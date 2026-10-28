export const collectionOptions = [
  { id: 'kurio', name: 'Seleção Kurio' },
  { id: 'boredapeyachtclub', name: 'Bored Ape Yacht Club' },
  { id: 'argonauts', name: 'Argonauts' },
  { id: 'suited-ape-society', name: 'Suited Ape Society' },
  { id: 'mutant-ape-yacht-club', name: 'Mutant Ape Yacht Club' },
  { id: 'bodoggos', name: 'Bodoggos' },
  { id: 'galactic-geckos-solana', name: 'Galactic Geckos' },
] as const

export const catalogSorts = ['featured', 'price-asc', 'price-desc', 'name'] as const
export type CatalogSort = (typeof catalogSorts)[number]
export type CollectionId = (typeof collectionOptions)[number]['id']
export const networkOptions = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'solana', name: 'Solana' },
  { id: 'robinhood', name: 'Robinhood' },
] as const
export type Network = (typeof networkOptions)[number]['id']

export interface NftEdition {
  id: string
  name: string
  available: number
}

export interface Nft {
  id: string
  name: string
  description: string
  imageUrl: string
  imageAlt: string
  collection: CollectionId
  network: Network
  priceEth: string
  previousPriceEth?: string
  attributes: { name: string; value: string }[]
  editions: NftEdition[]
  version: number
  source:
    | { type: 'figma'; nodeId: string }
    | {
        type: 'opensea'
        contract: string
        tokenId: string
        url: string
      }
}

export interface CatalogSearch {
  q?: string
  collection?: CollectionId
  network?: Network
  minPrice?: string
  maxPrice?: string
  sort: CatalogSort
  page: number
}

export interface CatalogResponse {
  items: Nft[]
  total: number
  page: number
  pageSize: number
  counts: {
    collections: Record<CollectionId, number>
    networks: Record<Network, number>
  }
}

export interface CatalogApiError {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'TRANSIENT_ERROR'
  message: string
}

export interface NftUpdatedEvent {
  id: string
  type: 'nft.updated'
  resourceId: string
  version: number
  data: Pick<Nft, 'priceEth' | 'editions'>
}

export const isEthAmount = (value: string) => /^\d{1,18}(\.\d{1,18})?$/.test(value)

export function ethToWei(value: string): bigint {
  if (!isEthAmount(value)) throw new Error('Valor ETH inválido')
  const [integer, fraction = ''] = value.split('.')
  return BigInt(integer) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
}

export function parseCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  const result: CatalogSearch = { sort: 'featured', page: 1 }

  if (input.q !== undefined) {
    if (typeof input.q !== 'string' || input.q.length > 200) throw new Error('Busca inválida')
    if (input.q.trim()) result.q = input.q.trim()
  }

  for (const key of ['minPrice', 'maxPrice'] as const) {
    const value = input[key]
    if (value === undefined || value === '') continue
    if (typeof value !== 'string' || !isEthAmount(value)) throw new Error('Preço inválido')
    result[key] = value
  }

  if (result.minPrice && result.maxPrice && ethToWei(result.minPrice) > ethToWei(result.maxPrice)) {
    throw new Error('O preço mínimo deve ser menor ou igual ao máximo')
  }

  if (input.collection !== undefined && input.collection !== '') {
    const match = collectionOptions.find(({ id }) => id === input.collection)
    if (!match) throw new Error('Coleção inválida')
    result.collection = match.id
  }

  if (input.network !== undefined && input.network !== '') {
    if (!networkOptions.some(({ id }) => id === input.network)) throw new Error('Rede inválida')
    result.network = input.network as Network
  }

  if (input.sort !== undefined) {
    if (!catalogSorts.includes(input.sort as CatalogSort)) throw new Error('Ordenação inválida')
    result.sort = input.sort as CatalogSort
  }

  if (input.page !== undefined) {
    const page = Number(input.page)
    if (!Number.isSafeInteger(page) || page < 1) throw new Error('Página inválida')
    result.page = page
  }
  return result
}
