import { useQuery } from '@tanstack/react-query'
import { catalogQueries, NftCard } from '#/modules/catalog'

export function CartDiscovery() {
  const catalog = useQuery(catalogQueries.list({ sort: 'featured', page: 1 }))
  return (
    <div className="mt-24 hidden lg:block">
      <section aria-labelledby="cart-discovery-title">
        <h2
          id="cart-discovery-title"
          className="mb-8 border-b border-border pb-3 text-base font-medium text-accent"
        >
          Colecionadores também viram
        </h2>
        <div className="grid grid-cols-5 gap-6">
          {catalog.data?.items.slice(0, 5).map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </div>
      </section>
    </div>
  )
}
