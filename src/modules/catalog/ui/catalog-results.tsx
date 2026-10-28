import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '#/shared/components/ui/button'
import { catalogQueries } from '../api/queries'
import type { CatalogSearch, Nft } from '../model/contracts'

function NftCard({ nft }: { nft: Nft }) {
  const [failed, setFailed] = useState(false)

  return (
    <article className="min-w-0">
      <div className="flex aspect-258/300 items-center bg-card p-1">
        <img
          src={failed ? '/images/nft-placeholder.svg' : nft.imageUrl}
          alt={failed ? `Imagem indisponível: ${nft.name}` : nft.imageAlt}
          width="250"
          height="250"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="aspect-square w-full rounded-xl object-cover"
        />
      </div>
      <h3 className="mt-3 wrap-break-word text-sm leading-5 md:text-base">{nft.name}</h3>
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

export function CatalogResults({
  search,
  onChange,
}: {
  search: CatalogSearch
  onChange: (search: CatalogSearch) => void
}) {
  const query = useQuery(catalogQueries.list(search))

  const pages = query.data ? Math.ceil(query.data.total / query.data.pageSize) : 0

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="catalog-title" className="text-sm font-bold text-primary">
          Todos os NFTs
        </h2>
        <label className="flex max-w-full flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Ordenar por:
          <select
            value={search.sort}
            onChange={(event) =>
              onChange({ ...search, sort: event.target.value as CatalogSearch['sort'], page: 1 })
            }
            className="min-w-0 rounded-md border border-input bg-background p-2 text-foreground"
          >
            <option value="featured">Destaques</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome</option>
          </select>
        </label>
      </div>
      {query.isError && (
        <div role="alert" className="mt-6 rounded-lg border border-border p-5">
          <p>Não foi possível carregar o catálogo.</p>
          <Button
            className="mt-4"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      {query.isPending ? (
        <div
          aria-hidden="true"
          className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-8 lg:gap-y-18"
        >
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-258/300 rounded-lg bg-linear-to-r from-card via-secondary to-card bg-size-[200%_100%] motion-safe:animate-[shimmer_1.5s_linear_infinite]" />
              <div className="h-5 w-4/5 rounded bg-card" />
              <div className="h-5 w-1/2 rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : (
        query.data && (
          <>
            {query.data.items.length ? (
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-8 lg:gap-y-18">
                {query.data.items.map((nft) => (
                  <NftCard key={`${nft.id}:${nft.imageUrl}`} nft={nft} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-border p-6">
                <p>
                  {query.data.total
                    ? 'Esta página não possui NFTs.'
                    : 'Nenhum NFT encontrado para estes filtros.'}
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => onChange({ sort: 'featured', page: 1 })}
                >
                  Voltar ao catálogo
                </Button>
              </div>
            )}
            {pages > 1 && (
              <nav
                aria-label="Paginação do catálogo"
                className="mt-10 flex flex-wrap items-center justify-end gap-3"
              >
                <Button
                  variant="outline"
                  disabled={search.page <= 1}
                  onClick={() => onChange({ ...search, page: search.page - 1 })}
                >
                  Anterior
                </Button>
                <span className="text-xs">
                  Página {search.page} de {pages}
                </span>
                <Button
                  variant="outline"
                  disabled={search.page >= pages}
                  onClick={() => onChange({ ...search, page: search.page + 1 })}
                >
                  Próxima
                </Button>
              </nav>
            )}
          </>
        )
      )}
    </div>
  )
}
