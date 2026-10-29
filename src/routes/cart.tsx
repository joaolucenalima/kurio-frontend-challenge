import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '#/modules/cart/page'

export const Route = createFileRoute('/cart')({ component: CartPage })
