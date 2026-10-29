import { delay, http, HttpResponse } from 'msw'
import { ethToWei, parseCatalogSearch } from '#/modules/catalog'
import type { CatalogApiError, CatalogResponse } from '#/modules/catalog'
import { initialNfts, reviewsForNft, setPriceChangeScenario, withScenarioPrice } from './fixtures'

const fixtureOrder = new Map(initialNfts.map(({ id }, index) => [id, index]))

export const scenarios = [
  'success',
  'empty',
  'slow',
  'transient-error',
  'out-of-order',
  'payment-success',
  'payment-declined',
  'payment-error',
  'payment-pending',
  'price-changed',
  'stock-conflict',
  'timeout-after-create',
] as const
export type Scenario = (typeof scenarios)[number]
let scenario: Scenario = 'success'
let requestCount = 0

export function selectScenario(value: string) {
  if (!scenarios.includes(value as Scenario)) throw new Error('Cenário desconhecido')
  scenario = value as Scenario
  setPriceChangeScenario(scenario === 'price-changed')
  requestCount = 0
}
export function currentScenario() {
  return scenario
}

export function resetSimulation() {
  selectScenario('success')
}

function error(code: CatalogApiError['code'], message: string, status: number) {
  return HttpResponse.json({ code, message } satisfies CatalogApiError, { status })
}

async function simulateNetwork() {
  const current = scenario
  const count = ++requestCount
  await delay(
    current === 'slow' ? 2500 : current === 'out-of-order' ? (count % 2 ? 1500 : 100) : 300,
  )
  return { empty: current === 'empty', failed: current === 'transient-error' && count === 1 }
}

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    let search
    try {
      search = parseCatalogSearch(Object.fromEntries(new URL(request.url).searchParams))
    } catch (cause) {
      return error(
        'VALIDATION_ERROR',
        cause instanceof Error ? cause.message : 'Parâmetros inválidos',
        400,
      )
    }

    const condition = await simulateNetwork()
    if (condition.failed)
      return error('TRANSIENT_ERROR', 'Não foi possível carregar os NFTs. Tente novamente.', 503)

    let items = condition.empty ? [] : initialNfts.map(withScenarioPrice)
    const counts: CatalogResponse['counts'] = {
      collections: {
        kurio: 0,
        boredapeyachtclub: 0,
        argonauts: 0,
        'suited-ape-society': 0,
        'mutant-ape-yacht-club': 0,
        bodoggos: 0,
        'galactic-geckos-solana': 0,
      },
      networks: { ethereum: 0, polygon: 0, solana: 0, robinhood: 0 },
    }
    for (const nft of items) {
      counts.collections[nft.collection]++
      counts.networks[nft.network]++
    }
    const term = search.q?.toLocaleLowerCase('pt-BR')
    items = items.filter(
      (nft) =>
        (!term || `${nft.name} ${nft.description}`.toLocaleLowerCase('pt-BR').includes(term)) &&
        (!search.collection || nft.collection === search.collection) &&
        (!search.network || nft.network === search.network) &&
        (!search.minPrice || ethToWei(nft.priceEth) >= ethToWei(search.minPrice)) &&
        (!search.maxPrice || ethToWei(nft.priceEth) <= ethToWei(search.maxPrice)),
    )

    items.sort((a, b) => {
      const rankingComparison =
        search.ranking === 'new-releases'
          ? b.releaseDate.localeCompare(a.releaseDate)
          : search.ranking === 'trending'
            ? b.salesCount - a.salesCount
            : 0
      if (rankingComparison !== 0) return rankingComparison

      if (search.sort === 'name') {
        const nameComparison = a.name.localeCompare(b.name, 'pt-BR')
        if (nameComparison !== 0) return nameComparison
      }

      if (search.sort === 'price-asc' || search.sort === 'price-desc') {
        const direction = search.sort === 'price-asc' ? 1 : -1
        const first = ethToWei(a.priceEth)
        const second = ethToWei(b.priceEth)
        if (first !== second) return (first < second ? -1 : 1) * direction
      }

      if (search.sort === 'featured') {
        const fixtureComparison = (fixtureOrder.get(a.id) ?? 0) - (fixtureOrder.get(b.id) ?? 0)
        if (fixtureComparison !== 0) return fixtureComparison
      }

      return a.id.localeCompare(b.id)
    })

    const pageSize = 9

    return HttpResponse.json({
      items: items.slice((search.page - 1) * pageSize, search.page * pageSize),
      total: items.length,
      page: search.page,
      pageSize,
      counts,
    } satisfies CatalogResponse)
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    const condition = await simulateNetwork()
    if (condition.failed) return error('TRANSIENT_ERROR', 'Falha temporária. Tente novamente.', 503)
    const found = initialNfts.find(({ id }) => id === params.id)
    const nft = found ? withScenarioPrice(found) : undefined
    return nft ? HttpResponse.json(nft) : error('NOT_FOUND', 'NFT não encontrado', 404)
  }),
  http.get('/api/nfts/:id/reviews', async ({ params }) => {
    const condition = await simulateNetwork()
    if (condition.failed) return error('TRANSIENT_ERROR', 'Falha temporária. Tente novamente.', 503)
    const found = initialNfts.find(({ id }) => id === params.id)
    const nft = found ? withScenarioPrice(found) : undefined
    return nft
      ? HttpResponse.json(reviewsForNft(nft))
      : error('NOT_FOUND', 'NFT não encontrado', 404)
  }),
  http.get('/api/nfts/:id/related', async ({ params }) => {
    const condition = await simulateNetwork()
    if (condition.failed) return error('TRANSIENT_ERROR', 'Falha temporária. Tente novamente.', 503)
    const found = initialNfts.find(({ id }) => id === params.id)
    const nft = found ? withScenarioPrice(found) : undefined
    if (!nft) return error('NOT_FOUND', 'NFT não encontrado', 404)
    const related = initialNfts
      .filter((item) => item.collection === nft.collection && item.id !== nft.id)
      .map(withScenarioPrice)
    for (let index = related.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      const selected = related[index]
      related[index] = related[randomIndex]
      related[randomIndex] = selected
    }
    return HttpResponse.json(related.slice(0, 8))
  }),
]
