import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '../modules/catalog'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailRoute,
})

function NftDetailRoute() {
  const { nftId } = Route.useParams()
  return <NftDetailPage id={nftId} />
}
