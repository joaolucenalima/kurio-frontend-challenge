import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { ChevronLeft, Heart, Minus, Plus, ZoomIn } from 'lucide-react'
import { Header } from '#/shared/components/header'
import { Button } from '#/shared/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '#/shared/components/ui/carousel'
import type { CarouselApi } from '#/shared/components/ui/carousel'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '#/shared/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/shared/components/ui/tabs'
import { catalogQueries } from '../api/queries'
import { collectionOptions } from '../model/contracts'
import type { Nft } from '../model/contracts'
import { NftCard } from './nft-card'

function Artwork({ nft, className }: { nft: Nft; className: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <img
      src={failed ? '/images/nft-placeholder.svg' : nft.displayImageUrl}
      alt={failed ? `Imagem indisponível: ${nft.imageAlt}` : nft.imageAlt}
      onError={() => setFailed(true)}
      className={className}
    />
  )
}

function Gallery({ nft }: { nft: Nft }) {
  const [zoomed, setZoomed] = useState(false)

  return (
    <div className="flex min-w-0 flex-col-reverse gap-4 md:flex-row md:items-start md:gap-7">
      <div
        aria-label="Opções de mídia do NFT"
        className="flex gap-3 overflow-x-auto md:max-h-112 md:flex-col md:overflow-y-auto"
      >
        <button
          type="button"
          aria-label={`Exibir imagem de ${nft.name}`}
          aria-pressed="true"
          className="relative size-18 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-primary bg-card focus-visible:outline-ring md:size-25"
        >
          <Artwork nft={nft} className="size-full object-cover" />
        </button>
      </div>
      <div className="relative flex aspect-square min-w-0 flex-1 items-center justify-center rounded-lg bg-card p-3 md:max-w-111 md:p-4">
        <Artwork nft={nft} className="size-full rounded-xl object-contain" />
        <Dialog
          onOpenChange={(open) => {
            if (!open) setZoomed(false)
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={`Ampliar imagem de ${nft.name}`}
              className="absolute top-2 right-2 rounded-full"
            >
              <ZoomIn aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="mb-3 max-w-[calc(100%-2rem)] truncate text-sm font-bold">
              {nft.name} · Imagem
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setZoomed((value) => !value)}
              aria-pressed={zoomed}
              className="mb-3"
            >
              <ZoomIn aria-hidden="true" /> {zoomed ? 'Ajustar' : 'Ampliar'}
            </Button>
            <div className="max-h-[78vh] overflow-auto rounded-lg bg-card text-center">
              <Artwork
                nft={nft}
                className={`${zoomed ? 'mx-auto min-w-[150%] max-w-none' : 'mx-auto max-h-[72vh] max-w-full'} object-contain`}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function RelatedNfts({ id }: { id: string }) {
  const query = useQuery(catalogQueries.related(id))

  const [api, setApi] = useState<CarouselApi>()
  const [selectedSnap, setSelectedSnap] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  useEffect(() => {
    if (!api) return
    const update = () => {
      setSelectedSnap(api.selectedScrollSnap())
      setSnapCount(api.scrollSnapList().length)
    }
    update()
    api.on('select', update)
    api.on('reInit', update)
    return () => {
      api.off('select', update)
      api.off('reInit', update)
    }
  }, [api])

  return (
    <section className="mt-16 md:mt-20" aria-labelledby="related-title">
      <div className="border-b border-border pb-3">
        <h2 id="related-title" className="text-lg font-bold text-accent">
          Mais desta coleção
        </h2>
      </div>
      {query.isError && (
        <div role="alert" className="mt-6">
          <p>Não foi possível carregar outros NFTs da coleção.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      {query.isPending ? (
        <div aria-hidden="true" className="mt-8 flex gap-6 overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-72 w-55 shrink-0 rounded-lg bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]"
            />
          ))}
        </div>
      ) : (
        query.data &&
        (query.data.length ? (
          <Carousel
            setApi={setApi}
            opts={{ align: 'start', containScroll: 'trimSnaps' }}
            className="mt-8"
          >
            <CarouselContent className="-ml-6">
              {query.data.map((nft) => (
                <CarouselItem key={nft.id} className="basis-3/4 pl-6 md:basis-1/3 lg:basis-1/5">
                  <NftCard nft={nft} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-7 flex items-center justify-center gap-5">
              <div className="flex items-center gap-2" aria-label="Páginas do carrossel">
                {Array.from({ length: snapCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Ir para a página ${index + 1} de ${snapCount}`}
                    aria-current={index === selectedSnap ? 'true' : undefined}
                    onClick={() => api?.scrollTo(index)}
                    className="size-3 rounded-full border border-primary bg-transparent aria-current:bg-primary"
                  />
                ))}
              </div>
            </div>
          </Carousel>
        ) : (
          <p className="mt-6 text-muted-foreground">Não há outros NFTs nesta coleção.</p>
        ))
      )}
    </section>
  )
}

function NftReviews({ nft }: { nft: Nft }) {
  const query = useQuery(catalogQueries.reviews(nft.id))

  if (query.isPending) {
    return (
      <output className="mt-6 block text-sm text-muted-foreground">Carregando avaliações...</output>
    )
  }
  if (query.isError || !Array.isArray(query.data)) {
    return (
      <div role="alert" className="mt-6">
        <p>Não foi possível carregar as avaliações.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => void query.refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }
  if (!query.data.length) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">Este NFT ainda não recebeu avaliações.</p>
    )
  }

  return (
    <ul className="max-h-80 overflow-y-auto mt-6 grid gap-4 md:grid-cols-2">
      {query.data.map((review) => (
        <li key={review.id} className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-bold">{review.author}</span>
            <span aria-label={`${review.rating} de 5 estrelas`} className="text-accent">
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </span>
          </div>
          <p lang={review.language} className="mt-3 text-sm leading-6 text-muted-foreground">
            {review.content}
          </p>
        </li>
      ))}
    </ul>
  )
}

function ReviewSummary({ count }: { count: number }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-normal text-foreground">
      <span aria-hidden="true" className="whitespace-nowrap tracking-wider text-xl text-accent">
        {count ? '★★★★☆' : '☆☆☆☆☆'}
      </span>
      <span>{count} avaliações de colecionadores</span>
    </span>
  )
}

function DetailContent({ nft }: { nft: Nft }) {
  const [editionId, setEditionId] = useState(nft.editions[0]?.id)
  const [quantity, setQuantity] = useState(1)

  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
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
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="rounded-full"
          aria-label="Favoritar indisponível"
          disabled
        >
          <Heart aria-hidden="true" />
        </Button>
      </div>
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Gallery key={nft.id} nft={nft} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold md:text-[28px]">{nft.name}</h1>
          <div className="mt-3 hidden flex-wrap items-center justify-between gap-3 border-b border-border pb-2 md:flex">
            <p className="text-xl font-bold text-accent md:text-[22px]">{nft.priceEth} ETH</p>
            <ReviewSummary count={nft.reviewCount} />
          </div>
          <h2 className="mt-6 text-sm font-bold">Sobre este NFT:</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{nft.description}</p>
          <fieldset className="mt-6">
            <legend className="text-sm font-bold">Edição:</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {nft.editions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.available === 0}
                  aria-pressed={edition?.id === item.id}
                  onClick={() => {
                    setEditionId(item.id)
                    setQuantity(1)
                  }}
                  className="min-h-8 rounded-full border border-border px-3 text-sm text-muted-foreground aria-pressed:border-primary aria-pressed:text-accent disabled:opacity-40"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 hidden flex-wrap items-center justify-between gap-5 md:flex">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2" aria-label="Quantidade">
                <Button
                  type="button"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => value - 1)}
                >
                  <Minus aria-hidden="true" />
                </Button>
                <output aria-live="polite" className="min-w-6 text-center">
                  {quantity}
                </output>
                <Button
                  type="button"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label="Aumentar quantidade"
                  disabled={!edition || quantity >= edition.available}
                  onClick={() => setQuantity((value) => value + 1)}
                >
                  <Plus aria-hidden="true" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {edition ? `${edition.available} disponíveis` : 'Indisponível'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled
                title="Compra disponível em uma próxima etapa"
                className="h-10 w-32"
              >
                COMPRAR
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled
                title="Favoritos disponíveis em uma próxima etapa"
                className="h-10 w-32 border-primary text-accent"
              >
                <Heart aria-hidden="true" /> Favoritar
              </Button>
            </div>
          </div>
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

      <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-[2.5rem] border-t border-border bg-card px-6 pt-5 pb-6 shadow-2xl md:hidden">
        <div className="mx-auto flex max-w-page items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Qtd.</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => value - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <output aria-live="polite" className="min-w-5 text-center">
              {quantity}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Aumentar quantidade"
              disabled={!edition || quantity >= edition.available}
              onClick={() => setQuantity((value) => value + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
            <span
              className="whitespace-nowrap text-xs text-muted-foreground"
              aria-label={edition ? `${edition.available} disponíveis` : 'Indisponível'}
              aria-live="polite"
            >
              {edition ? `${edition.available} disp.` : 'Indisp.'}
            </span>
          </div>
          <span className="font-bold text-accent">{nft.priceEth} ETH</span>
        </div>

        <div className="mx-auto mt-3 max-w-page">
          <ReviewSummary count={nft.reviewCount} />
        </div>
        <div className="mx-auto mt-4 flex max-w-page gap-3">
          <Button
            type="button"
            disabled
            title="Compra disponível em uma próxima etapa"
            className="h-12 flex-1 rounded-full"
          >
            Comprar NFT
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            disabled
            aria-label="Favoritar indisponível"
            className="size-12 rounded-full"
          >
            <Heart aria-hidden="true" />
          </Button>
        </div>
      </div>

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
