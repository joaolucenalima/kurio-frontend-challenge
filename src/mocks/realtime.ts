import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { authenticatedUser } from './session'
import { updateMockNft } from './fixtures'

type Connection = ReturnType<typeof toSocketIo>
const connections = new Map<Connection, { token: string | null }>()
// MSW 3 strips /socket.io/ when matching connection events, but the
// HTTP upgrade handler still matches the full transport path.
const socketUrl = new URL(location.origin)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
const socketOrigin = Array.from(socketUrl.origin, (character) =>
  '^$.*+?()[]{}|'.includes(character) ? String.fromCharCode(92) + character : character,
).join('')
const endpoint = ws.link(new RegExp(`^${socketOrigin}(?:/socket[.]io)?/?$`))
function owner(token: string | null) {
  return token
    ? authenticatedUser(
        new Request(location.origin, { headers: { Authorization: `Bearer ${token}` } }),
      )
    : null
}
export const realtimeHandlers = [
  endpoint.addEventListener('connection', (connection) => {
    const socket = toSocketIo(connection)
    const heartbeat = setInterval(() => connection.client.send('2'), 20000)
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      connections.delete(socket)
    })
    socket.client.on('session.authenticate', (_event, input: { token: string | null }) => {
      if (input.token && !owner(input.token)) {
        socket.client.emit('session.invalid')
        return
      }
      connections.set(socket, input)
      socket.client.emit('session.ready')
    })
  }),
]
export function publish(event: string, payload: unknown, userId?: string) {
  for (const [socket, session] of connections) {
    const user = owner(session.token)
    if (session.token && !user) {
      socket.client.emit('session.invalid')
      continue
    }
    if (!userId || user?.id === userId) socket.client.emit(event, payload)
  }
}
export function changeNft(id: string, update: Parameters<typeof updateMockNft>[1]) {
  const nft = updateMockNft(id, update)
  const event = {
    eventId: crypto.randomUUID(),
    nftId: id,
    version: nft.version,
    priceEth: nft.priceEth,
    editions: nft.editions,
  }
  publish('nft.updated', event)
  return event
}
export function disconnectSockets() {
  for (const socket of connections.keys()) socket.rawClient.close()
  connections.clear()
}
