import { expect, test } from '@playwright/test'
import { reset } from './helpers'

test('falha de favorito reverte atualização otimista e permite tentar novamente', async ({
  page,
}) => {
  await reset(page)
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
  await page.goto('/nfts/emerald-ape')
  const add = page
    .getByRole('button', { name: 'Favoritar Emerald Ape #042' })
    .filter({ visible: true })
    .first()
  await expect(add).toBeEnabled()
  await page.evaluate(() => window.kurioMocks!.failNextFavoriteMutation())
  await add.click()
  await expect(
    page.getByText('Não foi possível atualizar os favoritos. Tente novamente.', { exact: true }),
  ).toBeVisible()
  await expect(add).toHaveAttribute('aria-pressed', 'false')
  await add.click()
  const remove = page
    .getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' })
    .filter({ visible: true })
    .first()
  await expect(remove).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(
    page
      .getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' })
      .filter({ visible: true })
      .first(),
  ).toHaveAttribute('aria-pressed', 'true')
})
