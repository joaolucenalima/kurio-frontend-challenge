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

export interface NftMedia {
  id: string
  kind: 'image' | 'animation'
  url: string
  thumbnailUrl: string
  alt: string
}

export interface NftDetails {
  network: string
  contract: string
  copyright: string
}

export interface NftRecord {
  id: string
  name: string
  tokenId: string
  description: string
  contractAddress: string
  displayImageUrl: string
  displayAnimationUrl: string | null
  additionalImageUrls: string[]
  imageAlt: string
  collection: CollectionId
  network: Network
  priceEth: string
  previousPriceEth: string | null
  traits: string[]
  rarityRank: number | null
  releaseDate: string
  salesCount: number
  reviewCount: number
  editions: NftEdition[]
  version: number
}

export interface Nft extends NftRecord {
  details: NftDetails
  media: NftMedia[]
}

export interface NftReview {
  id: string
  author: string
  rating: number
  content: string
  language: 'pt-BR' | 'en'
}

export type NftInput = Omit<NftRecord, 'description'> & {
  description?: string | null
  details?: Partial<NftDetails>
}

export const defaultCollectionDescriptions: Record<CollectionId, string> = {
  kurio:
    'Arte digital da seleção Kurio, apresentada nesta demonstração com metadados e disponibilidade simulados.',
  boredapeyachtclub:
    'Retrato digital da coleção Bored Ape Yacht Club. Os atributos exibidos correspondem aos metadados deste item.',
  argonauts:
    'Peça da coleção Argonauts. Consulte as mídias e os atributos associados a este token.',
  'suited-ape-society':
    'Personagem digital da coleção Suited Ape Society, com características próprias registradas nos metadados do item.',
  'mutant-ape-yacht-club':
    'Peça da coleção Mutant Ape Yacht Club. A imagem e os atributos disponíveis identificam esta edição.',
  bodoggos:
    'Colecionável digital da coleção Bodoggos. Confira as características e a mídia fornecidas para este item.',
  'galactic-geckos-solana':
    'Personagem da coleção Galactic Geckos na rede Solana. Seus atributos são apresentados conforme os dados do item.',
}

export const defaultNetworkDescriptions: Record<Network, string> = {
  ethereum: 'Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.',
  polygon: 'Este NFT está associado à rede Polygon. As operações nesta aplicação são simuladas.',
  solana: 'Este NFT está associado à rede Solana. As operações nesta aplicação são simuladas.',
  robinhood:
    'Este NFT está associado à rede Robinhood. As operações nesta aplicação são simuladas.',
}

export function normalizeNft(input: NftInput): Nft {
  const address = input.contractAddress
  const shortAddress =
    address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
  const images = [...new Set([input.displayImageUrl, ...input.additionalImageUrls])]
  return {
    ...input,
    description: input.description?.trim() || defaultCollectionDescriptions[input.collection],
    media: [
      ...images.map((url, index): NftMedia => ({
        id: `image-${index}`,
        kind: 'image',
        url,
        thumbnailUrl: input.displayImageUrl,
        alt: index === 0 ? input.imageAlt : `${input.name}, imagem ${index + 1}`,
      })),
      ...(input.displayAnimationUrl
        ? [
            {
              id: 'animation',
              kind: 'animation' as const,
              url: input.displayAnimationUrl,
              thumbnailUrl: input.displayImageUrl,
              alt: `${input.name}, animação`,
            },
          ]
        : []),
    ],
    details: {
      network: input.details?.network?.trim() || defaultNetworkDescriptions[input.network],
      contract:
        'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
      copyright: `${shortAddress} • Contrato inteligente ERC-721 verificado.`,
    },
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

export function parseCatalogResponse(input: unknown): CatalogResponse {
  if (
    !input ||
    typeof input !== 'object' ||
    !('items' in input) ||
    !Array.isArray(input.items) ||
    !('total' in input) ||
    !Number.isSafeInteger(input.total) ||
    Number(input.total) < 0 ||
    !('page' in input) ||
    !Number.isSafeInteger(input.page) ||
    Number(input.page) < 1 ||
    !('pageSize' in input) ||
    !Number.isSafeInteger(input.pageSize) ||
    Number(input.pageSize) < 1 ||
    !('counts' in input) ||
    !input.counts ||
    typeof input.counts !== 'object' ||
    !('collections' in input.counts) ||
    !input.counts.collections ||
    !('networks' in input.counts) ||
    !input.counts.networks
  ) {
    throw new Error('A API retornou uma resposta inválida para o catálogo')
  }

  return {
    ...(input as CatalogResponse),
    items: (input as CatalogResponse).items.map((item) => normalizeNft(item)),
  }
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
