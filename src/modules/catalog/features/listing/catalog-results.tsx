import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/shared/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { catalogQueries } from '../../api/queries'
import type { CatalogRanking, CatalogSearch } from '../../model/contracts'
import { NftCard } from '../../ui/nft-card'

const catalogTabClassName =
  'flex-1 cursor-pointer whitespace-nowrap px-0 text-[11px] md:text-[15px] md:flex-none md:px-3'

export function CatalogResults({
  search,
  onChange,
}: {
  search: CatalogSearch
  onChange: (search: CatalogSearch) => void
}) {
  const query = useQuery(catalogQueries.list(search))

  const pages = query.data ? Math.ceil(query.data.total / query.data.pageSize) : 0
  const firstPage = Math.max(1, Math.min(search.page - 1, pages - 3))
  const visiblePages = Array.from({ length: Math.min(4, pages) }, (_, index) => firstPage + index)

  const panel = (
    <>
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
                  <NftCard key={`${nft.id}:${nft.displayImageUrl}`} nft={nft} />
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
                  onClick={() => onChange({ ranking: 'all', sort: 'recently-listed', page: 1 })}
                >
                  Voltar ao catálogo
                </Button>
              </div>
            )}
            {pages > 1 && (
              <nav
                aria-label="Paginação do catálogo"
                className="mt-8 flex items-center justify-end gap-2 md:mt-22"
              >
                {search.page > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Página anterior"
                    className="size-8.75 rounded-sm p-0 shadow-none"
                    onClick={() => onChange({ ...search, page: search.page - 1 })}
                  >
                    <ChevronLeft className="size-4.5" aria-hidden="true" />
                  </Button>
                )}
                {visiblePages.map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={page === search.page ? 'default' : 'outline'}
                    size="icon"
                    aria-label={`Página ${page} de ${pages}`}
                    aria-current={page === search.page ? 'page' : undefined}
                    className="size-8.75 rounded-sm p-0 text-lg leading-4 font-normal shadow-none aria-[current=page]:font-bold"
                    onClick={() => onChange({ ...search, page })}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Próxima página"
                  className="size-8.75 rounded-sm p-0 shadow-none"
                  disabled={search.page >= pages}
                  onClick={() => onChange({ ...search, page: search.page + 1 })}
                >
                  <ChevronRight className="size-4.5" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </>
        )
      )}
    </>
  )

  return (
    <Tabs
      value={search.ranking}
      onValueChange={(ranking) =>
        onChange({ ...search, ranking: ranking as CatalogRanking, page: 1 })
      }
      className="min-w-0 flex-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>
        <TabsList aria-label="Visualização do catálogo" className="w-full gap-2 md:w-auto">
          <TabsTrigger value="all" className={catalogTabClassName}>
            Todos os NFTs
          </TabsTrigger>
          <TabsTrigger value="new-releases" className={catalogTabClassName}>
            Novos lançamentos
          </TabsTrigger>
          <TabsTrigger value="trending" className={catalogTabClassName}>
            Em alta
          </TabsTrigger>
        </TabsList>
        <div className="hidden md:flex max-w-full flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <label htmlFor="catalog-sort">Ordenar por:</label>
          <Select
            value={search.sort}
            onValueChange={(value) =>
              onChange({ ...search, sort: value as CatalogSearch['sort'], page: 1 })
            }
          >
            <SelectTrigger id="catalog-sort" className="min-w-0 bg-background text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="recently-listed">Listados recentemente</SelectItem>
              <SelectItem value="featured">Destaques</SelectItem>
              <SelectItem value="price-asc">Menor preço</SelectItem>
              <SelectItem value="price-desc">Maior preço</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <TabsContent value="all">{search.ranking === 'all' ? panel : null}</TabsContent>
      <TabsContent value="new-releases">
        {search.ranking === 'new-releases' ? panel : null}
      </TabsContent>
      <TabsContent value="trending">{search.ranking === 'trending' ? panel : null}</TabsContent>
    </Tabs>
  )
}
