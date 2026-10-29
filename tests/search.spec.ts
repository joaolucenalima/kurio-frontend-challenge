import { expect, test } from '@playwright/test'
import { reset } from './helpers'

test.beforeEach(async ({ page }) => reset(page))

test('pesquisa global envia o termo e restaura no histórico', async ({ page }) => {
  const trigger = page
    .getByRole('button', { name: 'Buscar NFTs' })
    .filter({ visible: true })
    .first()
  await trigger.click()
  const search = page.getByRole('combobox', { name: 'Buscar NFTs' })
  await expect(search).toBeFocused()
  await search.fill('Emerald')
  await search.press('Enter')
  await expect(page).toHaveURL(/q=Emerald/)
  await expect(page.getByText('Emerald Ape #042').first()).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/q=Emerald/)
})

test('pesquisa limita entrada e permite fechar com Escape', async ({ page }) => {
  const trigger = page
    .getByRole('button', { name: 'Buscar NFTs' })
    .filter({ visible: true })
    .first()
  await trigger.click()
  const search = page.getByRole('combobox', { name: 'Buscar NFTs' })
  await search.fill('x'.repeat(250))
  await expect(search).toHaveValue('x'.repeat(200))
  await search.press('Escape')
  await expect(search).not.toBeVisible()
  await expect(trigger).toBeFocused()
})
