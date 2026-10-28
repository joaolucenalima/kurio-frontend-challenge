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
        className="overflow-hidden group flex aspect-258/300 items-center transition-colors border border-transparent bg-card focus-visible:outline-ring hover:border-accent"
      >
        <img
          src={failed ? '/images/nft-placeholder.svg' : nft.displayImageUrl}
          alt={failed ? `Imagem indisponível: ${nft.name}` : nft.imageAlt}
          width="250"
          height="250"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="aspect-square w-full rounded-xl object-cover transition-transform group-hover:scale-105 group-hover:rounded-none"
        />
      </Link>
      <h3 className="mt-3 wrap-break-word text-sm leading-5 md:text-base">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="hover:text-accent hover:underline"
        >
          {nft.name}
        </Link>
      </h3>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm font-bold text-accent md:text-lg">
        <span>{nft.priceEth} ETH</span>
        {nft.previousPriceEth && (
          <del className="font-normal text-subtle">
            <span className="sr-only">Preço anterior: </span>
            {nft.previousPriceEth} ETH
          </del>
        )}
      </p>
    </article>
  )
}
