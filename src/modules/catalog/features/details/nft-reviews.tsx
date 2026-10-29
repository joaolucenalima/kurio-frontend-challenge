import { useQuery } from '@tanstack/react-query'
import { Button } from '#/shared/components/ui/button'
import { catalogQueries } from '../../api/queries'
import type { Nft } from '../../model/contracts'

export function NftReviews({ nft }: { nft: Nft }) {
  const query = useQuery(catalogQueries.reviews(nft.id))

  if (query.isPending) {
    return (
      <output className="mt-6 block text-sm text-muted-foreground">Carregando avaliações...</output>
    )
  }
  if (query.isError || !Array.isArray(query.data)) {
    return (
      <div role="alert" className="mt-6">
        <p>Não foi possível carregar as avaliações.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => void query.refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }
  if (!query.data.length) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">Este NFT ainda não recebeu avaliações.</p>
    )
  }

  return (
    <ul className="max-h-80 overflow-y-auto mt-6 grid gap-4 md:grid-cols-2">
      {query.data.map((review) => (
        <li key={review.id} className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-bold">{review.author}</span>
            <span aria-label={`${review.rating} de 5 estrelas`} className="text-accent">
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </span>
          </div>
          <p lang={review.language} className="mt-3 text-sm leading-6 text-muted-foreground">
            {review.content}
          </p>
        </li>
      ))}
    </ul>
  )
}
