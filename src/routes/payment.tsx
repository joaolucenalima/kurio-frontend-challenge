import { createFileRoute } from '@tanstack/react-router'
import { PaymentPage } from '#/modules/checkout'

export const Route = createFileRoute('/payment')({ component: PaymentPage })
