import { httpClient } from '#/shared/api/http'
import type { PasswordChange, Profile, ProfileInput } from '../model/contracts'

export const profileKey = (userId: string) => ['profile', userId] as const

export const profileApi = {
  async get(signal?: AbortSignal) {
    const { data } = await httpClient.get<Profile>('/profile', { signal })
    return data
  },
  async update(input: ProfileInput) {
    const { data } = await httpClient.patch<Profile>('/profile', input)
    return data
  },
  async changePassword(input: PasswordChange) {
    await httpClient.put('/profile/password', input)
  },
}
