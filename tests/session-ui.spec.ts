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

test('cadastro valida campos, cria conta e preserva sessão', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('button', { name: 'Criar perfil', exact: true }).click()
  await expect(page.getByText('Use pelo menos 3 caracteres')).toBeVisible()
  await page.getByLabel('Nome de usuário').fill('ColecionadorTeste')
  await page.getByLabel('E-mail', { exact: true }).fill('novo@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('NovaSenha123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Criar perfil', exact: true }).click()
  await expect(page).not.toHaveURL(/\/signup/)
  await page.goto('/profile')
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'novo@kurio.test',
  )
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'novo@kurio.test',
  )
})

test('cadastro rejeita e-mail já utilizado', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Nome de usuário').fill('NovoColecionador')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('NovaSenha123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Criar perfil', exact: true }).click()
  await expect(page.getByText('E-mail já cadastrado')).toBeVisible()
  await expect(page).toHaveURL(/\/signup/)
})
