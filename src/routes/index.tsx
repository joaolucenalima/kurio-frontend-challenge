import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage, parseCatalogSearch } from '../modules/catalog'

export const Route = createFileRoute('/')({
  validateSearch: (input) => {
    try {
      return parseCatalogSearch(input)
    } catch {
      return { ranking: 'all' as const, sort: 'recently-listed' as const, page: 1 }
    }
  },
  component: CatalogRoute,
})

function CatalogRoute() {
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
