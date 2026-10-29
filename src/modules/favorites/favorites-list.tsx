import { useQuery } from '@tanstack/react-query'
import { NftCard } from '#/modules/catalog'
import { favoritesApi, favoritesKey } from './index'

export function FavoritesList({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: favoritesKey(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
  })

  if (query.isPending) return <p>Carregando favoritos…</p>
  if (query.isError)
    return (
      <div role="alert">
        Não foi possível carregar os favoritos.{' '}
        <button className="text-accent underline" onClick={() => void query.refetch()}>
          Tentar novamente
        </button>
      </div>
    )
  if (!query.data.length)
    return <p className="text-muted-foreground">Você ainda não favoritou NFTs.</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {query.data.map((nft) => (
        <NftCard key={nft.id} nft={nft} />
      ))}
    </div>
  )
}
