import { http, HttpResponse } from 'msw'
import { loginSchema, signupSchema, type SessionUser } from '#/modules/session/model'

const STORE_KEY = 'kurio.mock.auth.v1'
type Account = SessionUser & { salt: string; passwordHash: string }
type Store = {
  accounts: Account[]
  sessions: Record<string, { userId: string; expiresAt: number }>
}
const encoder = new TextEncoder()
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  return hex(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100_000, hash: 'SHA-256' },
        key,
        256,
      ),
    ),
  )
}

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '') as Store
  } catch {
    return { accounts: [], sessions: {} }
  }
}
function write(store: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function resetAuth() {
  localStorage.removeItem(STORE_KEY)
  localStorage.removeItem('kurio.session.token.v1')
}

export async function seedAuth() {
  if (localStorage.getItem(STORE_KEY)) return
  const accounts: Account[] = []
  for (const [username, email] of [
    ['Admin', 'admin@kurio.test'],
    ['UserTest', 'test@kurio.test'],
    ['João', 'joao@kurio.test'],
  ]) {
    const salt = crypto.randomUUID()
    accounts.push({
      id: crypto.randomUUID(),
      username,
      email,
      salt,
      passwordHash: await hash('Kurio123!', salt),
    })
  }
  write({ accounts, sessions: {} })
}

function createSession(store: Store, user: Account) {
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + 60 * 60_000
  store.sessions[token] = { userId: user.id, expiresAt }
  write(store)
  return { token, expiresAt, user: { id: user.id, username: user.username, email: user.email } }
}

export const sessionHandlers = [
  http.post('/api/accounts', async ({ request }) => {
    const parsed = signupSchema.safeParse(await request.json())
    if (!parsed.success)
      return HttpResponse.json(
        { message: parsed.error.issues[0]?.message, field: parsed.error.issues[0]?.path[0] },
        { status: 400 },
      )
    const store = read()
    const { username, email, password } = parsed.data
    if (store.accounts.some((account) => account.email === email))
      return HttpResponse.json({ message: 'E-mail já cadastrado', field: 'email' }, { status: 409 })
    if (store.accounts.some((account) => account.username.toLowerCase() === username.toLowerCase()))
      return HttpResponse.json(
        { message: 'Nome de usuário já cadastrado', field: 'username' },
        { status: 409 },
      )
    const salt = crypto.randomUUID()
    const user = {
      id: crypto.randomUUID(),
      username,
      email,
      salt,
      passwordHash: await hash(password, salt),
    }
    store.accounts.push(user)
    return HttpResponse.json(createSession(store, user), { status: 201 })
  }),

  http.post('/api/session', async ({ request }) => {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success)
      return HttpResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 })
    const store = read()
    const user = store.accounts.find((account) => account.email === parsed.data.email)
    if (!user || user.passwordHash !== (await hash(parsed.data.password, user.salt)))
      return HttpResponse.json({ message: 'E-mail ou senha inválidos' }, { status: 401 })
    return HttpResponse.json(createSession(store, user))
  }),

  http.get('/api/session', ({ request }) => {
    const store = read()
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') || ''
    const session = store.sessions[token]
    const user = store.accounts.find((account) => account.id === session?.userId)
    if (!session || !user || session.expiresAt <= Date.now())
      return HttpResponse.json({ message: 'Sessão expirada' }, { status: 401 })
    return HttpResponse.json({
      token,
      expiresAt: session.expiresAt,
      user: { id: user.id, username: user.username, email: user.email },
    })
  }),

  http.delete('/api/session', ({ request }) => {
    const store = read()
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') || ''
    delete store.sessions[token]
    write(store)
    return new HttpResponse(null, { status: 204 })
  }),
]
