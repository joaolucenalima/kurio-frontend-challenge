import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage, parseCatalogSearch } from '../modules/catalog'

export const Route = createFileRoute('/')({
  validateSearch: (input) => {
    try {
      return parseCatalogSearch(input)
    } catch {
      return { sort: 'featured' as const, page: 1 }
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
        void navigate({ search: next, resetScroll: false })
      }}
    />
  )
}
