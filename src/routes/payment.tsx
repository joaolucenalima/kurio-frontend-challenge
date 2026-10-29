import { createFileRoute } from '@tanstack/react-router'
import { PaymentPage } from '#/modules/checkout'

export const Route = createFileRoute('/payment')({
  validateSearch: (search: Record<string, unknown>) => ({
    intent: search.intent === 'checkout' ? ('checkout' as const) : undefined,
  }),
  component: PaymentRoute,
})

function PaymentRoute() {
  const { intent } = Route.useSearch()
  return <PaymentPage startCheckout={intent === 'checkout'} />
}
