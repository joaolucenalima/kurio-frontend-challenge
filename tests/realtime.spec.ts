import { expect, test } from '@playwright/test'
import { reset } from './helpers'

test.beforeEach(async ({ page }) => reset(page))

test('evento de NFT atualiza detalhe e eventos antigos não revertem preço', async ({ page }) => {
  await page.goto('/nfts/emerald-ape')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByText('1.19 ETH').filter({ visible: true }).first()).toBeVisible()
  await page.evaluate(() => {
    const old = window.kurioMocks!.changeNft('emerald-ape', { priceEth: '2.5' })
    ;(window as Window & { oldNftEvent?: unknown }).oldNftEvent = old
  })
  await expect(page.getByText('2.5 ETH').filter({ visible: true }).first()).toBeVisible()
  await page.evaluate(() => window.kurioMocks!.changeNft('emerald-ape', { priceEth: '3.5' }))
  await expect(page.getByText('3.5 ETH').filter({ visible: true }).first()).toBeVisible()
  await page.evaluate(() => {
    const old = (window as Window & { oldNftEvent?: unknown }).oldNftEvent
    window.kurioMocks!.publish('nft.updated', old)
    window.kurioMocks!.publish('nft.updated', old)
  })
  await expect(page.getByText('3.5 ETH').filter({ visible: true }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByText('3.5 ETH').filter({ visible: true }).first()).toBeVisible()
})
