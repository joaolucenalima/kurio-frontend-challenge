import { useEffect, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '#/shared/components/ui/carousel'

const artworks = [
  {
    src: '/images/nfts/emerald-ape.png',
    alt: 'Emerald Ape, macaco de jaqueta verde e óculos de sol',
  },
  {
    src: '/images/nfts/sage-nomad.png',
    alt: 'Sage Nomad, macaco com chapéu verde e moletom violeta',
  },
  { src: '/images/nfts/golden-beat.png', alt: 'Golden Beat, arte digital da coleção Kurio' },
]

export function HeroCarousel({ mobile = false }: { mobile?: boolean }) {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!api) return
    const update = () => setSelected(api.selectedScrollSnap())
    update()
    api.on('select', update)
    api.on('reInit', update)
    return () => {
      api.off('select', update)
      api.off('reInit', update)
    }
  }, [api])

  useEffect(() => {
    if (!api || hovered || focused || reducedMotion) return
    const timer = window.setInterval(() => {
      if (!document.hidden) api.scrollNext()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [api, hovered, focused, reducedMotion, selected])

  return (
    <div
      className={mobile ? 'h-36.5 w-34.5 shrink-0' : 'w-2/5 shrink-0 lg:w-hero-image'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <Carousel
        opts={{ loop: true, duration: reducedMotion ? 0 : 25 }}
        setApi={setApi}
        aria-label="Artes em destaque"
        className={
          mobile ? 'rounded-2xl overflow-hidden' : 'rounded-xl overflow-hidden lg:rounded-3xl'
        }
      >
        <CarouselContent className="ml-0" aria-live="off">
          {artworks.map((artwork, index) => (
            <CarouselItem
              key={artwork.src}
              className="pl-0"
              aria-label={`${index + 1} de ${artworks.length}`}
              aria-hidden={index !== selected}
            >
              <img
                src={artwork.src}
                alt={artwork.alt}
                width="450"
                height="450"
                className="aspect-square w-full object-cover"
                draggable={false}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {mobile && (
        <img
          src="/images/nfts/sage-nomad.png"
          alt=""
          width="58"
          height="58"
          className="pointer-events-none relative -mt-12.5 ml-3.5 size-14.5 rounded-2xl object-cover"
        />
      )}
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center">
        <fieldset aria-label="Páginas do carrossel" className="flex">
          {artworks.map((artwork, index) => (
            <button
              key={artwork.src}
              type="button"
              aria-label={`Exibir arte ${index + 1} de ${artworks.length}`}
              aria-pressed={index === selected}
              onClick={() => api?.scrollTo(index)}
              className="flex size-6 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`size-1.75 rounded-full bg-primary ${index === selected ? 'ring-1 ring-primary ring-offset-2 ring-offset-background' : 'opacity-50'}`}
              />
            </button>
          ))}
        </fieldset>
      </div>
    </div>
  )
}
