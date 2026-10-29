import { expect, test } from '@playwright/test'

test('catálogo mantém parâmetros após refresh', async ({ page }) => {
  await page.goto('/?q=ape&sort=name&page=1')
  await expect(page.locator('main')).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/q=ape/)
  await expect(page).toHaveURL(/sort=name/)
})

test('detalhe inexistente informa que o NFT não foi encontrado', async ({ page }) => {
  await page.goto('/nfts/nft-inexistente')
  await expect(page.getByText(/NFT não encontrado/i).first()).toBeVisible()
})
