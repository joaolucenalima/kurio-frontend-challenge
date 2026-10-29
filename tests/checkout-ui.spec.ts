import { expect, test, type Page } from '@playwright/test'
import { reset } from './helpers'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function openCheckout(page: Page) {
  await login(page)
  await page.goto('/nfts/emerald-ape')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page
    .getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })
    .filter({ visible: true })
    .click()
  await expect(page).toHaveURL(/\/cart/)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByRole('radio', { name: /MetaMask/ }).check()
}

test.beforeEach(async ({ page }) => reset(page))

test('compra do detalhe ao recibo confirmado e persistente', async ({ page }) => {
  await openCheckout(page)
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Confirmar compra' })
  await expect(review).toBeVisible()
  await expect(review.getByText('Emerald Ape #042')).toBeVisible()
  await review.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('region', { name: 'Confirmação de pedido' })).toBeVisible({
    timeout: 15000,
  })
  await expect(
    page.getByRole('region', { name: 'Confirmação de pedido' }).getByText('Emerald Ape #042'),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByRole('region', { name: 'Confirmação de pedido' })).toBeVisible()
})

test('mudança de preço durante revisão invalida confirmação', async ({ page }) => {
  await openCheckout(page)
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Confirmar compra' })
  await expect(review).toBeVisible()
  await page.evaluate(() => window.kurioMocks!.changeNft('emerald-ape', { priceEth: '2.5' }))
  await expect(review).not.toBeVisible()
  await expect(page.getByText(/Preço ou disponibilidade atualizado/i).first()).toBeVisible()
})

test('pedido pendente mantém diálogo e preserva itens', async ({ page }) => {
  await openCheckout(page)
  await page.evaluate(() => window.kurioMocks!.scenario('payment-pending'))
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Confirmar compra' })
  await review.getByRole('button', { name: 'Confirmar compra' }).click()
  const pending = page.getByRole('dialog', { name: 'Pedido em processamento' })
  await expect(pending).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(pending).toBeVisible()
  await expect(pending.getByText('Emerald Ape #042')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Confirmação de pedido' })).toHaveCount(0)
})

test('validação de e-mail impede revisão e criação do pedido', async ({ page }) => {
  await openCheckout(page)
  await page.getByLabel('E-mail', { exact: true }).fill('inválido')
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(page.getByText('Informe um e-mail válido')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Confirmar compra' })).not.toBeVisible()
})
