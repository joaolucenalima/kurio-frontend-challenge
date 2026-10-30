import { usePageTitle } from '#/shared/hooks/use-page-title'
import { RequireSession } from '#/modules/session/require-session'
import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '#/modules/cart/page'

export const Route = createFileRoute('/cart')({
  component: CartRoute,
})

function CartRoute() {
  usePageTitle('Carrinho')
  return (
    <RequireSession>
      <CartPage />
    </RequireSession>
  )
}
