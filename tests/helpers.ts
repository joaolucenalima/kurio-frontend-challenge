import { expect, type Page } from '@playwright/test'

export async function reset(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => !!window.kurioMocks)
  await page.evaluate(async () => {
    await window.kurioMocks!.reset()
  })
  await page.reload()
  await page.waitForFunction(() => !!window.kurioMocks)
}

export async function api(
  page: Page,
  path: string,
  options: { method?: string; body?: unknown; token?: string; key?: string } = {},
) {
  return page.evaluate(
    async ({ path, options }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (options.token) headers.Authorization = `Bearer ${options.token}`
      if (options.key) headers['Idempotency-Key'] = options.key
      const response = await fetch(path, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })
      const text = await response.text()
      return { status: response.status, body: text ? JSON.parse(text) : null }
    },
    { path, options },
  )
}

export async function loginApi(page: Page, email = 'admin@kurio.test') {
  const result = await api(page, '/api/session', {
    method: 'POST',
    body: { email, password: 'Kurio123!' },
  })
  expect(result.status).toBe(200)
  return result.body.token as string
}

export async function prepareOrder(page: Page, token: string, key = 'test-order') {
  const line = { nftId: 'emerald-ape', editionId: 'limited', quantity: 1 }
  expect((await api(page, '/api/cart/items', { method: 'POST', token, body: line })).status).toBe(
    200,
  )
  const wallets = await api(page, '/api/wallets', { token })
  const wallet = wallets.body[0]
  expect(
    (
      await api(page, '/api/wallets/connect', {
        method: 'POST',
        token,
        body: { walletId: wallet.id, application: 'metamask' },
      })
    ).status,
  ).toBe(200)
  const quote = (await api(page, '/api/cart/quote', { token })).body
  return {
    idempotencyKey: key,
    quoteId: quote.id,
    collector: { email: 'admin@kurio.test', note: '' },
    wallets: [wallet],
  }
}
