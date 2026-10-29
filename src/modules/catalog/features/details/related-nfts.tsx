import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Carousel, CarouselContent, CarouselItem } from '#/shared/components/ui/carousel'
import type { CarouselApi } from '#/shared/components/ui/carousel'
import { Button } from '#/shared/components/ui/button'
import { catalogQueries } from '../../api/queries'
import { NftCard } from '../../ui/nft-card'

export function RelatedNfts({ id }: { id: string }) {
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
