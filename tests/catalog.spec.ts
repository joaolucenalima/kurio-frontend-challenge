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

test('paginação mantém filtros combinados e histórico restaura resultados', async ({ page }) => {
  await page.goto('/?collection=boredapeyachtclub&network=ethereum&sort=name&page=1')
  const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })
  await expect(pagination).toBeVisible()
  await pagination.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page).toHaveURL(/collection=boredapeyachtclub/)
  await expect(page).toHaveURL(/network=ethereum/)
  await expect(page).toHaveURL(/sort=name/)
  await expect(pagination.getByRole('button', { name: /Página 2 de/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.goBack()
  await expect(page).toHaveURL(/page=1/)
  await expect(pagination.getByRole('button', { name: /Página 1 de/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.goForward()
  await expect(page).toHaveURL(/page=2/)
  await page.reload()
  await expect(pagination.getByRole('button', { name: /Página 2 de/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('busca sem resultados oferece retorno ao catálogo', async ({ page }) => {
  await page.goto('/?q=termo-inexistente-123')
  await expect(page.getByText('Nenhum NFT encontrado para estes filtros.')).toBeVisible()
  await page.getByRole('button', { name: 'Voltar ao catálogo' }).click()
  await expect(page).not.toHaveURL(/q=/)
  await expect(page.getByRole('navigation', { name: 'Paginação do catálogo' })).toBeVisible()
})
