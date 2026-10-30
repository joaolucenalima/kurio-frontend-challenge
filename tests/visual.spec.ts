import { expect, test, type Page } from '@playwright/test'
import { reset } from './helpers'

test.use({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' })

async function stable(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images)
        .filter((image) => {
          const rect = image.getBoundingClientRect()
          return (
            rect.bottom > 0 &&
            rect.top < window.innerHeight &&
            rect.right > 0 &&
            rect.left < window.innerWidth
          )
        })
        .map((image) => image.decode().catch(() => undefined)),
    )
  })
}

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-01T12:00:00Z'))
  await reset(page)
})

test('início', async ({ page }) => {
  await expect(page.getByRole('navigation', { name: 'Paginação do catálogo' })).toBeVisible()
  await stable(page)
  await expect(page).toHaveScreenshot('inicio.png')
})

test('detalhe', async ({ page }) => {
  await page.goto('/nfts/emerald-ape')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await stable(page)
  await expect(page).toHaveScreenshot('detalhe.png')
})

for (const screen of ['carrinho', 'pagamento'] as const) {
  test(screen, async ({ page }) => {
    await login(page)
    await page.goto('/nfts/emerald-ape')
    await page
      .getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })
      .filter({ visible: true })
      .click()
    await expect(page).toHaveURL(/\/cart/)
    await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByText('1.206 ETH').filter({ visible: true }).first()).toBeVisible()
    if (screen === 'pagamento') {
      await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
      await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
      await expect(page.getByRole('radio', { name: /Carteira principal/ })).toBeChecked()
    }
    await stable(page)
    await expect(page).toHaveScreenshot(`${screen}.png`)
  })
}
