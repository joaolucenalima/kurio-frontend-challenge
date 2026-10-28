import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '#/shared/lib/utils'

type CarouselApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>
type EmblaOptionsType = Parameters<typeof useEmblaCarousel>[0]
type CarouselContextValue = {
  api: CarouselApi | undefined
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error('Carousel components must be used inside Carousel')
  return context
}

function Carousel({
  className,
  opts,
  setApi,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  opts?: EmblaOptionsType
  setApi?: (api: CarouselApi) => void
}) {
  const [viewportRef, api] = useEmblaCarousel(opts)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return
    const update = () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }
    update()
    setApi?.(api)
    api.on('select', update)
    api.on('reInit', update)
    return () => {
      api.off('select', update)
      api.off('reInit', update)
    }
  }, [api, setApi])

  return (
    <CarouselContext.Provider
      value={{
        api,
        scrollPrev: () => api?.scrollPrev(),
        scrollNext: () => api?.scrollNext(),
        canScrollPrev,
        canScrollNext,
      }}
    >
      <section aria-roledescription="carrossel" className={cn('relative', className)} {...props}>
        <div ref={viewportRef} className="overflow-hidden">
          {children}
        </div>
      </section>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex -ml-4 touch-pan-y', className)} {...props} />
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <section
      aria-roledescription="slide"
      className={cn('min-w-0 shrink-0 grow-0 basis-full pl-4', className)}
      {...props}
    />
  )
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollPrev, canScrollPrev } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Ver NFTs anteriores"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      className={className}
      {...props}
    >
      <ChevronLeft aria-hidden="true" />
    </Button>
  )
}

function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollNext, canScrollNext } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Ver próximos NFTs"
      disabled={!canScrollNext}
      onClick={scrollNext}
      className={className}
      {...props}
    >
      <ChevronRight aria-hidden="true" />
    </Button>
  )
}

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
export type { CarouselApi }
