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
    let generation = 0
    let retry: ReturnType<typeof setTimeout> | undefined
    let authenticationTimeout: ReturnType<typeof setTimeout> | undefined
    let authenticated = false
    let failures = 0
    const status = (ready: boolean) => client.setQueryData(['realtime-ready'], ready)
    const stop = () => {
      generation++
      authenticated = false
      clearTimeout(retry)
      clearTimeout(authenticationTimeout)
      status(false)
    }
    const reconcile = async () => {
      const current = ++generation
      clearTimeout(retry)
      status(false)
      try {
        await client.cancelQueries({
          predicate: (q) =>
            ['catalog', 'cart', 'cart-quote', 'order', 'orders'].includes(String(q.queryKey[0])),
        })
        await client.invalidateQueries(
          {
            predicate: (q) =>
              ['catalog', 'cart', 'cart-quote', 'order', 'orders'].includes(String(q.queryKey[0])),
            refetchType: 'active',
          },
          { throwOnError: true },
        )
        if (active && authenticated && socket.connected && current === generation) {
          failures = 0
          status(true)
        }
      } catch {
        if (active && authenticated && socket.connected && current === generation) {
          const delay = Math.min(1000 * 2 ** failures++, 5000)
          retry = setTimeout(() => void reconcile(), delay)
        }
      }
    }
    socket.on('connect', () => {
      stop()
      socket.emit('session.authenticate', { token: token || null })
      authenticationTimeout = setTimeout(() => {
        if (active && !authenticated) {
          socket.disconnect()
          socket.connect()
        }
      }, 10000)
    })
    socket.on('session.ready', () => {
      clearTimeout(authenticationTimeout)
      authenticated = true
      void reconcile()
    })
    socket.on('disconnect', stop)
    socket.on('connect_error', stop)
    socket.on('session.invalid', () => {
      if (!active) return
      stop()
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
      void reconcile()
    })
    socket.on('order.updated', (input: unknown) => {
      const parsed = orderEvent.safeParse(input)
      if (!parsed.success || parsed.data.userId !== userId) return
      const event = parsed.data
      if (!accept(event.eventId, `order:${event.orderId}`, event.version)) return
      void client.invalidateQueries({ queryKey: ['order', userId, event.orderId] })
      void client.invalidateQueries({ queryKey: ['orders', userId] })
    })
    socket.connect()
    return () => {
      active = false
      stop()
      socket.removeAllListeners()
      socket.disconnect()
      status(false)
    }
  }, [client, notify, token, userId, session.isPending])
  return null
}
