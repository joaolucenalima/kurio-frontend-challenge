import { queryClient } from '#/app/query-client'
import { usePageTitle } from '#/shared/hooks/use-page-title'
import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage, catalogQueries, parseCatalogSearch } from '../modules/catalog'

export const Route = createFileRoute('/')({
  validateSearch: (input) => {
    try {
      return parseCatalogSearch(input)
    } catch {
      return { ranking: 'all' as const, sort: 'recently-listed' as const, page: 1 }
    }
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => {
    void queryClient.query(catalogQueries.list(deps)).catch(() => {
      // O estado de erro é apresentado pela consulta na página.
    })
  },
  component: CatalogRoute,
})

function CatalogRoute() {
  usePageTitle('Marketplace de NFTs')
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <CatalogPage
      search={search}
      onSearchChange={(next) => {
        void navigate({ search: next, hash: true, resetScroll: false })
      }}
    />
  )
}
