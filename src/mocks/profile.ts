import { http, HttpResponse } from 'msw'
import { profileSchema, passwordChangeSchema } from '#/modules/profile/model'
import {
  accountProfile,
  authenticatedUser,
  updateAccountPassword,
  updateAccountProfile,
} from './session'

const fail = (message: string, status: number) => HttpResponse.json({ message }, { status })

export const profileHandlers = [
  http.get('/api/profile', ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const profile = accountProfile(user.id)
    return profile ? HttpResponse.json(profile) : fail('Perfil não encontrado', 404)
  }),

  http.patch('/api/profile', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const parsed = profileSchema.safeParse(await request.json())
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Dados inválidos', 400)
    const result = updateAccountProfile(user.id, parsed.data)
    return result.data
      ? HttpResponse.json(result.data)
      : fail(result.error || 'Não foi possível atualizar o perfil', result.status || 409)
  }),

  http.put('/api/profile/password', async ({ request }) => {
    const user = authenticatedUser(request)
    if (!user) return fail('Sessão inválida', 401)
    const parsed = passwordChangeSchema.safeParse(await request.json())
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Dados inválidos', 400)
    const result = await updateAccountPassword(user.id, parsed.data)
    return result.data
      ? HttpResponse.json({ updated: true })
      : fail(result.error || 'Não foi possível atualizar a senha', result.status || 422)
  }),
]
