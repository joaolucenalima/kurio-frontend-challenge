import type { WalletInput } from './contracts'

export function walletConflicts(input: WalletInput, others: readonly WalletInput[]) {
  const normalizeName = (value: string) => value.trim().toLocaleLowerCase('pt-BR')
  const normalizeAddress = (value: string) =>
    value.trim().startsWith('0x') ? value.trim().toLowerCase() : value.trim()
  return (['alias', 'address'] as const)
    .filter((field) => {
      const normalize = field === 'address' ? normalizeAddress : normalizeName
      return others.some((wallet) => normalize(wallet[field]) === normalize(input[field]))
    })
    .map((field) => ({
      field,
      message:
        field === 'address'
          ? 'Este endereço já está cadastrado em outra carteira.'
          : 'Este nome já está em uso em outra carteira.',
    }))
}
