import { httpClient } from '#/shared/api/http'
import { isAxiosError } from 'axios'
import { TOKEN_KEY, type LoginInput, type Session, type SignupInput } from './model'

export const sessionApi = {
  async current() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    try {
      const { data } = await httpClient.get<Session>('/session')
      return data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        return null
      }
      throw error
    }
  },
  async login(input: LoginInput) {
    const { data } = await httpClient.post<Session>('/session', input)
    localStorage.setItem(TOKEN_KEY, data.token)
    return data
  },
  async signup(input: SignupInput) {
    const { data } = await httpClient.post<Session>('/accounts', input)
    localStorage.setItem(TOKEN_KEY, data.token)
    return data
  },
  async logout() {
    try {
      await httpClient.delete('/session')
    } finally {
      localStorage.removeItem(TOKEN_KEY)
    }
  },
}
