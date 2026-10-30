import { expect, test } from '@playwright/test'
import { reset } from './helpers'

test.beforeEach(async ({ page }) => {
  await reset(page)
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
  await page.goto('/profile')
})

test('perfil valida e persiste alterações', async ({ page }) => {
  const name = page.getByRole('textbox', { name: 'Nome de exibição', exact: true })
  await expect(name).toHaveValue('Admin')
  await name.fill('A')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(
    page.getByRole('alert').filter({ hasText: 'Informe seu nome de exibição' }),
  ).toBeVisible()
  await name.fill('Colecionador Admin')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(name).toHaveValue('Colecionador Admin')
})

test('senha atual incorreta é rejeitada e nova senha permite login', async ({ page }) => {
  const area = page.getByRole('region', { name: 'Alterar senha' })
  await area.locator('#currentPassword').fill('incorreta')
  await area.locator('#newPassword').fill('SenhaNova123!')
  await area.locator('#confirmPassword').fill('SenhaNova123!')
  await area.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('A senha atual não confere', { exact: true })).toBeVisible()
  await area.locator('#currentPassword').fill('Kurio123!')
  await area.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Senha atualizada.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('SenhaNova123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  await expect(page).not.toHaveURL(/\/login/)
})

test('carteira secundária valida endereço e persiste edição', async ({ page }) => {
  await page.goto('/profile?tab=wallets')
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Adicionar carteira secundária' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(dialog.getByText('Informe o apelido da carteira')).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Carteira reserva')
  await dialog
    .getByRole('textbox', { name: 'Endereço da carteira' })
    .fill('0x3333333333333333333333333333333333333333')
  await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByText('Carteira reserva', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Editar carteira Carteira reserva' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar carteira' })
  await edit.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Reserva editada')
  await edit.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(edit).not.toBeVisible()
  await page.reload()
  await expect(page.getByText('Reserva editada', { exact: true })).toBeVisible()
})
