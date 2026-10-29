import { useState } from 'react'
import { ZoomIn } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import type { Nft } from '../../model/contracts'

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

export function Gallery({ nft }: { nft: Nft }) {
  const [zoomed, setZoomed] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  function moveZoom(event: React.PointerEvent<HTMLDivElement>) {
    const image = event.currentTarget.querySelector('img')
    if (!image) return
    const bounds = image.getBoundingClientRect()
    const naturalRatio = image.naturalWidth / image.naturalHeight
    if (!naturalRatio) return
    const width = Math.min(bounds.width, bounds.height * naturalRatio)
    const height = width / naturalRatio
    const left = bounds.left + (bounds.width - width) / 2
    const top = bounds.top + (bounds.height - height) / 2
    setPosition({
      x: Math.max(0, Math.min(1, (event.clientX - left) / width)),
      y: Math.max(0, Math.min(1, (event.clientY - top) / height)),
    })
  }

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
      <div
        className={`relative flex aspect-square min-w-0 flex-1 items-center justify-center rounded-lg bg-card p-3 md:max-w-111 md:p-4 ${zoomed ? 'cursor-crosshair' : ''}`}
        onPointerMove={zoomed ? moveZoom : undefined}
        onPointerLeave={() => setPosition(null)}
      >
        <Artwork nft={nft} className="size-full rounded-xl object-contain" />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`${zoomed ? 'Desativar zoom' : 'Ampliar imagem'} de ${nft.name}`}
          aria-pressed={zoomed}
          onClick={() => {
            setZoomed((value) => !value)
            setPosition(null)
          }}
          className="absolute top-2 right-2 rounded-full aria-pressed:bg-accent aria-pressed:text-accent-foreground"
        >
          <ZoomIn aria-hidden="true" />
        </Button>
        {zoomed && position && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-full z-30 ml-4 aspect-square w-full max-w-111 overflow-hidden rounded-lg border border-primary bg-card shadow-xl max-lg:left-0 max-lg:top-full max-lg:ml-0 max-lg:mt-4"
            style={{
              backgroundImage: `url(${nft.displayImageUrl})`,
              backgroundSize: '250% 250%',
              backgroundPosition: `${position.x * 100}% ${position.y * 100}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>
    </div>
  )
}
