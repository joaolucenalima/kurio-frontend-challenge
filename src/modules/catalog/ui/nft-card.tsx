import { useState } from 'react'
import type { Nft } from '../model/contracts'
import { Link } from '@tanstack/react-router'
import { FavoriteButton } from '#/modules/favorites'

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  const [failed, setFailed] = useState(false)
  const isRare =
    nft.rarityRank !== null &&
    Number.isInteger(nft.rarityRank) &&
    nft.rarityRank >= 1 &&
    nft.rarityRank <= 1000

  return (
    <article className="group/card relative min-w-0">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`Ver detalhes de ${nft.name}`}
        className="group block min-w-0 border border-transparent bg-card p-3 transition-colors focus-visible:outline-ring hover:border-accent hover:text-accent"
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={failed ? '/images/nft-placeholder.svg' : nft.displayImageUrl}
            alt={failed ? `Imagem indisponível: ${nft.name}` : nft.imageAlt}
            width="250"
            height="250"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="aspect-square w-full rounded-lg object-cover transition-transform motion-safe:group-hover:scale-105"
          />
          {isRare && (
            <span className="absolute top-4 left-0 bg-primary px-2 py-2 font-mono text-xs font-medium text-primary-foreground">
              RARO
            </span>
          )}
        </div>
        <h3 className="mt-3 truncate text-sm font-medium">{nft.name}</h3>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-accent">
          <span>{nft.priceEth} ETH</span>
          {nft.previousPriceEth && (
            <del className="font-normal text-subtle">
              <span className="sr-only">Preço anterior: </span>
              {nft.previousPriceEth} ETH
            </del>
          )}
        </p>
      </Link>
      <div className="absolute top-5 right-5 transition-opacity [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:pointer-events-auto [@media(hover:hover)]:group-hover/card:opacity-100 [@media(hover:hover)]:group-focus-within/card:pointer-events-auto [@media(hover:hover)]:group-focus-within/card:opacity-100">
        <FavoriteButton nft={nft} className="size-9 rounded-full bg-card" />
      </div>
    </article>
  )
}
