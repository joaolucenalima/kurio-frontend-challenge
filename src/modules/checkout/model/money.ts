import { ethToWei } from '#/modules/catalog'

export const formatEth = (value: string) => `${value} ETH`

export const formatLineSubtotal = (price: string, quantity: number) => {
  const value = ethToWei(price) * BigInt(quantity)
  const fraction = (value % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '')
  return `${value / 10n ** 18n}${fraction ? `.${fraction}` : ''}`
}
