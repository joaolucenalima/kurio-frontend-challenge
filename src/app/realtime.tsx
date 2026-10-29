import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createSocket } from '#/shared/api/socket'
import { sessionApi } from '#/modules/session/api'
import { useToast } from '#/shared/components/ui/toast'
import { z } from 'zod'

const nftEvent = z.object({
  eventId: z.string(),
  nftId: z.string(),
  version: z.number().int().positive(),
  priceEth: z.string().regex(/^\d+(\.\d+)?$/),
  editions: z.array(
    z.object({ id: z.string(), name: z.string(), available: z.number().int().nonnegative() }),
  ),
})
const orderEvent = z.object({
  eventId: z.string(),
  orderId: z.string(),
  userId: z.string(),
  version: z.number().int().positive(),
  status: z.enum(['pending', 'confirmed', 'declined']),
})

export function Realtime() {
  const client = useQueryClient()
  const { notify } = useToast()
  const session = useQuery({ queryKey: ['session'], queryFn: sessionApi.current, retry: false })
  const token = session.data?.token
  const userId = session.data?.user.id
  useEffect(() => {
    if (session.isPending) return
    let active = true
    const socket = createSocket()
    const versions = new Map<string, number>()
    const seen = new Set<string>()
    const accept = (id: string, resource: string, version: number) => {
      if (!active || seen.has(id) || version <= (versions.get(resource) || 0)) return false
      seen.add(id)
      if (seen.size > 1000) seen.delete(seen.values().next().value!)
      versions.set(resource, version)
      return true
    }
    const status = (ready: boolean) => client.setQueryData(['realtime-ready'], ready)
    const reconcile = async () => {
      status(false)
      await client.cancelQueries({
        predicate: (q) =>
          ['catalog', 'cart', 'cart-quote', 'order'].includes(String(q.queryKey[0])),
      })
      await client.invalidateQueries(
        {
          predicate: (q) =>
            ['catalog', 'cart', 'cart-quote', 'order'].includes(String(q.queryKey[0])),
          refetchType: 'active',
        },
        { throwOnError: true },
      )
      if (active) status(true)
    }
    socket.on('connect', () => socket.emit('session.authenticate', { token: token || null }))
    socket.on('session.ready', () => {
      void reconcile().catch(() => status(false))
    })
    socket.on('disconnect', () => status(false))
    socket.on('connect_error', () => status(false))
    socket.on('session.invalid', () => {
      if (!active) return
      status(false)
      socket.disconnect()
      void client.cancelQueries().then(() => {
        if (active) {
          client.clear()
          client.setQueryData(['session'], null)
        }
      })
    })
    socket.on('nft.updated', (input: unknown) => {
      const parsed = nftEvent.safeParse(input)
      if (!parsed.success) return
      const event = parsed.data
      if (!accept(event.eventId, `nft:${event.nftId}`, event.version)) return
      window.dispatchEvent(new Event('kurio:quote-stale'))
      notify({
        id: event.eventId,
        title: 'Preço ou disponibilidade atualizado. Revise sua compra.',
        variant: 'warning',
      })
      void reconcile().catch(() => status(false))
    })
    socket.on('order.updated', (input: unknown) => {
      const parsed = orderEvent.safeParse(input)
      if (!parsed.success || parsed.data.userId !== userId) return
      const event = parsed.data
      if (!accept(event.eventId, `order:${event.orderId}`, event.version)) return
      void client.invalidateQueries({ queryKey: ['order', userId, event.orderId] })
    })
    socket.connect()
    return () => {
      active = false
      socket.removeAllListeners()
      socket.disconnect()
      status(false)
    }
  }, [client, notify, token, userId, session.isPending])
  return null
}
