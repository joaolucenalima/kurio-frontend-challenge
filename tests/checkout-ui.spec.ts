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

test('recusa informa o resultado e mantém o item no carrinho', async ({ page }) => {
  await openCheckout(page)
  await page.evaluate(() => window.kurioMocks!.scenario('payment-declined'))
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Confirmar compra' })
    .getByRole('button', { name: 'Confirmar compra' })
    .click()
  const declined = page.getByRole('dialog', { name: 'Pagamento recusado' })
  await expect(declined).toBeVisible({ timeout: 15000 })
  await expect(
    declined.getByText('O pagamento foi recusado. Seus itens continuam no carrinho.'),
  ).toBeVisible()
  await expect(page.getByRole('region', { name: 'Confirmação de pedido' })).toHaveCount(0)
  await page.goto('/cart')
  await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
})

test('timeout após criação recupera pedido sem criar outro após refresh', async ({ page }) => {
  await openCheckout(page)
  await page.evaluate(() => window.kurioMocks!.scenario('timeout-after-create'))
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Confirmar compra' })
    .getByRole('button', { name: 'Confirmar compra' })
    .click()
  await expect(page.getByRole('dialog', { name: 'Pedido em processamento' })).toBeVisible()
  const ordersBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kurio.mock.orders.v1') || '{}'),
  )
  expect(Object.keys(ordersBefore)).toHaveLength(1)
  const orderId = Object.values(ordersBefore).map((order) => (order as { id: string }).id)[0]
  await page.reload()
  await expect(page.getByRole('region', { name: 'Confirmação de pedido' })).toBeVisible({
    timeout: 15000,
  })
  const ordersAfter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kurio.mock.orders.v1') || '{}'),
  )
  expect(Object.keys(ordersAfter)).toHaveLength(1)
  expect(Object.values(ordersAfter).map((order) => (order as { id: string }).id)[0]).toBe(orderId)
})

test('edição esgotada durante revisão bloqueia compra', async ({ page }) => {
  await openCheckout(page)
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Confirmar compra' })
  await expect(review).toBeVisible()
  await page.evaluate(() =>
    window.kurioMocks!.changeNft('emerald-ape', {
      editions: [
        { id: 'limited', name: 'Edição limitada', available: 0 },
        { id: 'artist', name: 'Edição do artista', available: 5 },
      ],
    }),
  )
  await expect(review).not.toBeVisible()
  await expect(
    page.getByText('Há itens sem disponibilidade. Volte ao carrinho para ajustar.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await expect(review).not.toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('kurio.mock.orders.v1'))).toBeNull()
})

test('clique repetido e desconexão durante pedido não criam outra compra', async ({ page }) => {
  await openCheckout(page)
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'Confirmar compra' })
  await review.getByRole('button', { name: 'Confirmar compra' }).dblclick({ delay: 20 })
  await expect(page.getByRole('dialog', { name: 'Pedido em processamento' })).toBeVisible()
  await page.evaluate(() => window.kurioMocks!.disconnect())
  await expect(page.getByRole('region', { name: 'Confirmação de pedido' })).toBeVisible({
    timeout: 15000,
  })
  const orders = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kurio.mock.orders.v1') || '{}'),
  )
  expect(Object.keys(orders)).toHaveLength(1)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Confirmação de pedido' })).toBeVisible()
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kurio.mock.orders.v1') || '{}'),
  )
  expect(Object.keys(after)).toEqual(Object.keys(orders))
})

test('sessão expirada no checkout permite login e retoma o carrinho', async ({ page }) => {
  await openCheckout(page)
  const email = page.getByLabel('E-mail', { exact: true })
  await email.fill('rascunho-invalido')
  await page.getByLabel('Observação do colecionador (opcional)').fill('manter contexto')
  await page.evaluate(() => window.kurioMocks!.expireCurrentSession())
  await page.reload()
  const enter = page.getByRole('button', { name: 'Entrar ou criar conta' })
  await expect(enter).toBeVisible()
  await enter.click()
  const dialog = page.getByRole('dialog', { name: 'Acessar conta' })
  await dialog.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
  await expect(email).toHaveValue('rascunho-invalido')
  await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
    'manter contexto',
  )
})

test('reset remove tentativa e rascunho mesmo com pedido pendente', async ({ page }) => {
  await openCheckout(page)
  await page.getByLabel('Observação do colecionador (opcional)').fill('rascunho')
  await page.evaluate(() => window.kurioMocks!.scenario('payment-pending'))
  await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Confirmar compra' })
    .getByRole('button', { name: 'Confirmar compra' })
    .click()
  await expect(page.getByRole('dialog', { name: 'Pedido em processamento' })).toBeVisible()
  await page.evaluate(async () => {
    await window.kurioMocks!.reset()
  })
  const remaining = await page.evaluate(() =>
    Object.keys(localStorage).filter(
      (key) => key.startsWith('kurio.checkout.') || key === 'kurio.mock.orders.v1',
    ),
  )
  expect(remaining).toEqual([])
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Entre para continuar com o pagamento' }),
  ).toBeVisible()
})
