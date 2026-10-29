import { queryOptions, type QueryClient } from '@tanstack/react-query'
import type { Order } from '../model'
import { orderKey } from '../model'
import { checkoutApi } from '../api'

export const orderQueryOptions = (client: QueryClient, userId: string, orderId: string) =>
  queryOptions({
    queryKey: orderKey(userId, orderId),
    queryFn: async ({ signal }) => {
      const fresh = await checkoutApi.getOrder(orderId, signal)
      const cached = client.getQueryData<Order>(orderKey(userId, orderId))
      if (!cached || (cached.status === 'pending' && fresh.version > cached.version)) return fresh
      return cached
    },
  })
