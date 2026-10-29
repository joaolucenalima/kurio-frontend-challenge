import { httpClient } from '#/shared/api/http'
import type { Wallet, WalletInput } from '../model/contracts'

export const walletsKey = (userId: string) => ['wallets', userId] as const

export const walletsApi = {
  async list(signal?: AbortSignal) {
    const { data } = await httpClient.get<Wallet[]>('/wallets', { signal })
    return data
  },
  async create(input: WalletInput) {
    const { data } = await httpClient.post<Wallet>('/wallets', input)
    return data
  },
  async update(id: string, input: WalletInput) {
    const { data } = await httpClient.patch<Wallet>(`/wallets/${id}`, input)
    return data
  },
  async remove(id: string) {
    await httpClient.delete(`/wallets/${id}`)
  },
}
