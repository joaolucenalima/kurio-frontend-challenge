import { expect, test } from '@playwright/test'
import { reset } from './helpers'

test.beforeEach(async ({ page }) => reset(page))

test('login protege dados e recupera sessão após refresh', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
  await page.goto('/profile')
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'admin@kurio.test',
  )
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'admin@kurio.test',
  )
})
