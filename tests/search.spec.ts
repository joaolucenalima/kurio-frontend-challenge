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

test('sugestões ignoram filtros e seleção por teclado abre o detalhe', async ({ page }) => {
  await page.goto('/?collection=boredapeyachtclub&network=ethereum&sort=name&page=2')
  await page.getByRole('button', { name: 'Buscar NFTs' }).filter({ visible: true }).first().click()
  const search = page.getByRole('combobox', { name: 'Buscar NFTs' })
  await search.fill('Emerald Ape')
  await expect(page.getByRole('option', { name: /Emerald Ape #042/ })).toBeVisible()
  await search.press('ArrowDown')
  await search.press('Enter')
  await expect(page).toHaveURL(/\/nfts\/emerald-ape/)
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('envio preserva filtros e ordenação e reinicia a página', async ({ page }) => {
  await page.goto('/?collection=boredapeyachtclub&network=ethereum&sort=name&page=2')
  await page.getByRole('button', { name: 'Buscar NFTs' }).filter({ visible: true }).first().click()
  const search = page.getByRole('combobox', { name: 'Buscar NFTs' })
  await search.fill('Ape')
  await search.press('Enter')
  await expect(page).toHaveURL(/q=Ape/)
  await expect(page).toHaveURL(/collection=boredapeyachtclub/)
  await expect(page).toHaveURL(/network=ethereum/)
  await expect(page).toHaveURL(/sort=name/)
  await expect(page).toHaveURL(/page=1/)
})

test('sem sugestões ainda é possível enviar ao catálogo', async ({ page }) => {
  await page.getByRole('button', { name: 'Buscar NFTs' }).filter({ visible: true }).first().click()
  const search = page.getByRole('combobox', { name: 'Buscar NFTs' })
  await search.fill('sem-nft-xyz')
  await expect(page.getByText('Nenhum NFT encontrado.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ver resultados no catálogo' }).click()
  await expect(page).toHaveURL(/q=sem-nft-xyz/)
  await expect(page.getByText('Nenhum NFT encontrado para estes filtros.')).toBeVisible()
})

test('busca lenta mostra carregamento e não mantém sugestões antigas', async ({ page }) => {
  await page.getByRole('button', { name: 'Buscar NFTs' }).filter({ visible: true }).first().click()
  const search = page.getByRole('combobox', { name: 'Buscar NFTs' })
  await search.fill('Emerald')
  await expect(page.getByRole('option', { name: /Emerald Ape #042/ })).toBeVisible()
  await page.evaluate(() => window.kurioMocks!.scenario('slow'))
  await search.fill('Sage')
  await expect(page.getByText('Buscando NFTs…')).toHaveCount(1)
  await expect(page.getByRole('option', { name: /Emerald Ape #042/ })).toHaveCount(0)
  await expect(page.getByRole('option', { name: /Sage Nomad #009/ })).toBeVisible({ timeout: 7000 })
})

test('respostas fora de ordem não substituem sugestões atuais', async ({ page }) => {
  await page.getByRole('button', { name: 'Buscar NFTs' }).filter({ visible: true }).first().click()
  const search = page.getByRole('combobox', { name: 'Buscar NFTs' })
  await page.evaluate(() => window.kurioMocks!.scenario('out-of-order'))
  await search.fill('Emerald')
  await expect(page.getByText('Buscando NFTs…')).toHaveCount(1)
  await expect
    .poll(() => page.evaluate(() => window.kurioMocks!.networkRequestCount()))
    .toBeGreaterThan(0)
  await search.fill('Sage')
  await expect(page.getByRole('option', { name: /Sage Nomad #009/ })).toBeVisible()
  await expect(page.getByRole('option', { name: /Emerald Ape #042/ })).toHaveCount(0)
})

test('falha de sugestões permite nova tentativa', async ({ page }) => {
  await page.getByRole('button', { name: 'Buscar NFTs' }).filter({ visible: true }).first().click()
  await page.evaluate(() => window.kurioMocks!.scenario('transient-error'))
  await page.getByRole('combobox', { name: 'Buscar NFTs' }).fill('Emerald')
  await expect(page.getByText('Não foi possível buscar sugestões.')).toBeVisible()
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('option', { name: /Emerald Ape #042/ })).toBeVisible()
})
