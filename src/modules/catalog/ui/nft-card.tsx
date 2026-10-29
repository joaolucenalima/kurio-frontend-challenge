import { useState } from 'react'
import type { Nft } from '../model/contracts'
import { Link } from '@tanstack/react-router'

export function NftCard({ nft }: { nft: Nft }) {
  const [failed, setFailed] = useState(false)

  return (
    <article className="min-w-0">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`Ver detalhes de ${nft.name}`}
        className="group block min-w-0 border border-transparent bg-card p-3 transition-colors focus-visible:outline-ring hover:border-accent hover:text-accent"
      >
        <div className="overflow-hidden rounded-lg">
          <img
            src={failed ? '/images/nft-placeholder.svg' : nft.displayImageUrl}
            alt={failed ? `Imagem indisponível: ${nft.name}` : nft.imageAlt}
            width="250"
            height="250"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="aspect-square w-full rounded-lg object-cover transition-transform motion-safe:group-hover:scale-105"
          />
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
    </article>
  )
}
