import { z } from 'zod'

export const walletNetworks = ['ethereum', 'polygon', 'solana', 'robinhood'] as const
export const walletKinds = ['extension', 'hardware', 'custodial'] as const

const evmAddress = /^0x[a-fA-F0-9]{40}$/
const solanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const walletSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(60),
    alias: z.string().trim().min(2, 'Informe o apelido da carteira').max(40),
    network: z.enum(walletNetworks, { error: 'Selecione uma rede' }),
    address: z.string().trim(),
    ensName: z
      .string()
      .trim()
      .max(63)
      .regex(/^[a-z0-9-]*(?:\.eth)?$/, 'Informe um nome ENS válido')
      .optional()
      .or(z.literal('')),
    kind: z.enum(walletKinds, { error: 'Selecione um tipo de carteira' }),
    isPrimary: z.boolean(),
  })
  .superRefine((wallet, context) => {
    const addressIsValid =
      wallet.network === 'solana'
        ? solanaAddress.test(wallet.address)
        : evmAddress.test(wallet.address)
    if (!addressIsValid)
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message:
          wallet.network === 'solana'
            ? 'Informe um endereço Solana válido'
            : 'Informe um endereço 0x com 40 caracteres hexadecimais',
      })
    if (wallet.network === 'solana' && wallet.ensName)
      context.addIssue({
        code: 'custom',
        path: ['ensName'],
        message: 'ENS está disponível apenas nas redes Ethereum e Polygon',
      })
  })

export type Wallet = z.infer<typeof walletSchema> & {
  id: string
  nftCount: number
  version: number
}
export type WalletInput = z.input<typeof walletSchema>
export type WalletKind = (typeof walletKinds)[number]
export type WalletNetwork = (typeof walletNetworks)[number]
