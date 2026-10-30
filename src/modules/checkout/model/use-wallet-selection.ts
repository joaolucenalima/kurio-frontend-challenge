/* eslint-disable react/set-state-in-effect */
import { useEffect, useState } from 'react'
import type { Wallet, WalletInput } from '#/modules/wallets/contracts'
import { walletSchema } from '#/modules/wallets/contracts'
import type { CheckoutWallet, WalletChoice } from '../model'

export function useWalletSelection({
  networks,
  wallets,
  temporaryWallets,
  userId,
  loaded,
}: {
  networks: string[]
  wallets: Wallet[]
  temporaryWallets: Record<string, WalletInput>
  userId?: string
  loaded: boolean
}) {
  const [choices, setChoices] = useState<Record<string, WalletChoice>>({})
  const networkKey = networks.join('|')

  useEffect(() => {
    if (!loaded) return
    setChoices((current) => {
      const next = { ...current }
      for (const network of networkKey.split('|').filter(Boolean)) {
        const choice = next[network]
        if (choice?.kind === 'temporary') continue
        const savedExists =
          choice?.kind === 'saved' &&
          wallets.some((wallet) => wallet.id === choice.walletId && wallet.network === network)
        if (savedExists) continue
        const preferred =
          wallets.find((wallet) => wallet.network === network && wallet.isPrimary) ||
          wallets.find((wallet) => wallet.network === network)
        next[network] = preferred
          ? { network, kind: 'saved', walletId: preferred.id }
          : { network, kind: 'temporary' }
      }
      return next
    })
  }, [wallets, networkKey, loaded])

  const chosen = (networks.length === 1 ? networks : []).flatMap<CheckoutWallet>((network) => {
    const choice = choices[network]
    const saved =
      choice?.kind === 'saved'
        ? wallets.find((wallet) => wallet.id === choice.walletId && wallet.network === network)
        : undefined
    if (saved) return [saved]
    const parsed = walletSchema.safeParse(temporaryWallets[network])
    return parsed.success
      ? [{ ...parsed.data, id: `temporary:${userId}:${network}`, temporary: true }]
      : []
  })

  return {
    choices,
    setChoices,
    chosen,
    allReady:
      networks.length === 1 &&
      networks.every((network) => chosen.some((wallet) => wallet.network === network)),
  }
}
