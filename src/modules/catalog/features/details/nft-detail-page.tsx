import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { FavoriteButton } from '#/modules/favorites'
import { ChevronLeft, Star } from 'lucide-react'
import { Header } from '#/shared/components/header'
import { Button } from '#/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/shared/components/ui/tabs'
import { catalogQueries } from '../../api/queries'
import { collectionOptions } from '../../model/contracts'
import type { Nft } from '../../model/contracts'
import { Gallery } from './nft-gallery'
import { NftReviews } from './nft-reviews'
import { ReviewSummary } from '../../ui/review-summary'
import { RelatedNfts } from './related-nfts'
import { PurchasePanel } from './nft-purchase-panel'

function DetailContent({ nft }: { nft: Nft }) {
  const reviews = useQuery(catalogQueries.reviews(nft.id))
  const rating = reviews.data?.length
    ? (reviews.data.reduce((sum, review) => sum + review.rating, 0) / reviews.data.length).toFixed(
        1,
      )
    : reviews.data
      ? '0.0'
      : '—'
  const [editionId, setEditionId] = useState(nft.editions[0]?.id)
  const [quantity, setQuantity] = useState(1)
  const edition =
    nft.editions.find((item) => item.id === editionId && item.available > 0) ??
    nft.editions.find((item) => item.available > 0)
  const safeQuantity = edition ? Math.min(quantity, edition.available) : 0
  const selectEdition = (id: string) => {
    setEditionId(id)
    setQuantity(1)
  }
  const collection =
    collectionOptions.find((item) => item.id === nft.collection)?.name ?? nft.collection

  return (
    <>
      <nav aria-label="Caminho de navegação" className="mb-6 hidden text-sm font-bold md:block">
        <Link
          to="/"
          search={{ ranking: 'all', sort: 'featured', page: 1 }}
          className="hover:text-accent"
        >
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          to="/"
          search={{ ranking: 'all', sort: 'featured', page: 1 }}
          hash="catalog"
          className="hover:text-accent"
        >
          Mercado
        </Link>
        <span className="sr-only"> / {nft.name}</span>
      </nav>
      <div className="mb-4 flex items-center justify-between md:hidden">
        <Button
          asChild
          variant="secondary"
          size="icon"
          className="rounded-full"
          aria-label="Voltar ao mercado"
        >
          <Link to="/" search={{ ranking: 'all', sort: 'featured', page: 1 }} hash="catalog">
            <ChevronLeft aria-hidden="true" />
          </Link>
        </Button>
        <FavoriteButton nft={nft} className="size-9 rounded-full bg-secondary" />
      </div>
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Gallery key={nft.id} nft={nft} />
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 text-lg font-bold wrap-break-word md:text-[28px]">{nft.name}</h1>
            <span
              aria-label={`${rating} de 5 estrelas, ${nft.reviewCount} avaliações`}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-accent md:hidden"
            >
              <Star aria-hidden="true" className="size-3.5 fill-current" />
              <span>
                {rating} ({nft.reviewCount})
              </span>
            </span>
          </div>
          <div className="mt-3 hidden flex-wrap items-center justify-between gap-3 border-b border-border pb-2 md:flex">
            <p className="text-xl font-bold text-accent md:text-[22px]">{nft.priceEth} ETH</p>
            <ReviewSummary count={nft.reviewCount} />
          </div>
          <h2 className="mt-6 text-sm font-bold">Sobre este NFT:</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{nft.description}</p>
          <PurchasePanel
            nft={nft}
            variant="desktop"
            edition={edition}
            quantity={safeQuantity}
            setQuantity={setQuantity}
            selectEdition={selectEdition}
          />
          <dl className="mt-5 space-y-2 text-sm text-subtle">
            <div>
              <dt className="inline">ID do token: </dt>
              <dd className="inline">{nft.tokenId}</dd>
            </div>
            <div>
              <dt className="inline">Coleção: </dt>
              <dd className="inline">{collection}</dd>
            </div>
            <div>
              <dt className="inline">Atributos: </dt>
              <dd className="inline">
                {nft.traits.length ? nft.traits.join(', ') : 'Não informados'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <PurchasePanel
        nft={nft}
        variant="mobile"
        edition={edition}
        quantity={safeQuantity}
        setQuantity={setQuantity}
        selectEdition={selectEdition}
      />

      <section className="mt-16 md:mt-20" aria-labelledby="details-title">
        <h2 id="details-title" className="sr-only">
          Informações do NFT
        </h2>
        <Tabs defaultValue="details" className="gap-0">
          <TabsList
            aria-label="Informações do NFT"
            className="flex w-full flex-wrap items-end gap-x-8 gap-y-3 border-b border-border"
          >
            <TabsTrigger
              value="details"
              className="min-h-0 cursor-pointer justify-start border-b-[3px] px-0 pb-3 text-base font-normal text-foreground hover:text-accent data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:text-accent"
            >
              Detalhes do NFT
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="min-h-0 cursor-pointer justify-start border-b-[3px] px-0 pb-3 text-base font-normal text-foreground hover:text-accent data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:text-accent"
            >
              Avaliações de colecionadores ({nft.reviewCount})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="flex flex-col gap-6">
            <p className="mt-6 text-sm leading-6 text-muted-foreground">{nft.description}</p>
            <div>
              <h3 className="text-sm font-bold">Rede:</h3>
              <p className="text-sm leading-8 text-muted-foreground">{nft.details.network}</p>
            </div>
            <div>
              <h3 className=" text-sm font-bold">Contrato:</h3>
              <p className="wrap-break-word text-sm leading-8 text-muted-foreground">
                {nft.details.contract}
              </p>
            </div>
            <div>
              <h3 className=" text-sm font-bold">Direitos autorais:</h3>
              <p className="text-sm leading-8 text-muted-foreground">{nft.details.copyright}</p>
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <NftReviews nft={nft} />
          </TabsContent>
        </Tabs>
      </section>
      <RelatedNfts id={nft.id} />
    </>
  )
}

export function NftDetailPage({ id }: { id: string }) {
  const query = useQuery(catalogQueries.detail(id))
  const missing = isAxiosError(query.error) && query.error.response?.status === 404

  return (
    <div className="px-6 pt-6 pb-52 md:py-6">
      <div className="mx-auto max-w-page">
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="md:mt-8">
          {query.isPending ? (
            <div aria-hidden="true" className="grid gap-8 lg:grid-cols-2">
              <div className="aspect-square rounded-lg bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]" />
              <div className="space-y-5">
                <div className="h-10 w-3/4 rounded bg-card" />
                <div className="h-8 w-1/3 rounded bg-secondary" />
                <div className="h-36 rounded bg-card" />
              </div>
            </div>
          ) : query.isError ? (
            <div role="alert" className="rounded-lg border border-border p-6">
              <h1 className="text-xl font-bold">
                {missing ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}
              </h1>
              <div className="mt-5 flex gap-3">
                {!missing && (
                  <Button type="button" onClick={() => void query.refetch()}>
                    Tentar novamente
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/" search={{ ranking: 'all', sort: 'featured', page: 1 }}>
                    Voltar ao catálogo
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            query.data && <DetailContent key={query.data.id} nft={query.data} />
          )}
        </main>
      </div>
    </div>
  )
}
