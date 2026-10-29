import { expect, test } from '@playwright/test'
import { api, loginApi, prepareOrder, reset } from './helpers'

test.beforeEach(async ({ page }) => reset(page))

test('contas, sessão e recursos privados são isolados', async ({ page }) => {
  expect((await api(page, '/api/profile')).status).toBe(401)
  const a = await loginApi(page)
  const b = await loginApi(page, 'test@kurio.test')
  expect((await api(page, '/api/favorites/emerald-ape', { method: 'PUT', token: a })).status).toBe(
    200,
  )
  const favoritesA = await api(page, '/api/favorites', { token: a })
  const favoritesB = await api(page, '/api/favorites', { token: b })
  expect(JSON.stringify(favoritesA.body)).toContain('emerald-ape')
  expect(JSON.stringify(favoritesB.body)).not.toContain('emerald-ape')
  expect((await api(page, '/api/session', { method: 'DELETE', token: a })).status).toBe(204)
  expect((await api(page, '/api/session', { token: a })).status).toBe(401)
  expect((await api(page, '/api/session', { token: b })).status).toBe(200)
})

test('carrinho valida estoque, cupom e precisão da cotação', async ({ page }) => {
  const token = await loginApi(page)
  await page.evaluate(() =>
    window.kurioMocks!.changeNft('emerald-ape', { priceEth: '0.123456789123456789' }),
  )
  const line = { nftId: 'emerald-ape', editionId: 'limited', quantity: 2 }
  expect((await api(page, '/api/cart/items', { method: 'POST', token, body: line })).status).toBe(
    200,
  )
  expect(
    (await api(page, '/api/cart/items', { method: 'POST', token, body: { ...line, quantity: 20 } }))
      .status,
  ).toBe(409)
  expect(
    (await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: 'EXPIRED' } }))
      .status,
  ).toBe(422)
  expect(
    (await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: 'INVALID' } }))
      .status,
  ).toBe(422)
  expect(
    (await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: ' kurio10 ' } }))
      .status,
  ).toBe(200)
  const quote = (await api(page, '/api/cart/quote', { token })).body
  expect(quote.subtotalEth).toBe('0.246913578246913578')
  expect(quote.discountEth).toBe('0.024691357824691357')
  expect(quote.totalEth).toBe('0.238222220422222221')
  await page.reload()
  await page.waitForFunction(() => !!window.kurioMocks)
  expect((await api(page, '/api/cart', { token })).body.items[0].quantity).toBe(2)
  expect(
    (await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: null } })).body
      .coupon,
  ).toBeNull()
  expect(
    (await api(page, '/api/cart/items/emerald-ape/limited', { method: 'DELETE', token })).body
      .items,
  ).toHaveLength(0)
})

test('pedido é idempotente e inacessível para outro usuário', async ({ page }) => {
  const token = await loginApi(page)
  await page.evaluate(() => window.kurioMocks!.scenario('payment-pending'))
  const input = await prepareOrder(page, token)
  const first = await api(page, '/api/orders', {
    method: 'POST',
    token,
    key: input.idempotencyKey,
    body: input,
  })
  expect(first.status).toBe(201)
  const again = await api(page, '/api/orders', {
    method: 'POST',
    token,
    key: input.idempotencyKey,
    body: input,
  })
  expect(again.body.id).toBe(first.body.id)
  const conflict = await api(page, '/api/orders', {
    method: 'POST',
    token,
    key: input.idempotencyKey,
    body: { ...input, collector: { ...input.collector, note: 'outro' } },
  })
  expect(conflict.status).toBe(409)
  const other = await loginApi(page, 'test@kurio.test')
  expect((await api(page, `/api/orders/${first.body.id}`, { token: other })).status).toBe(404)
  await page.reload()
  await page.waitForFunction(() => !!window.kurioMocks)
  expect((await api(page, `/api/orders/attempt/${input.idempotencyKey}`, { token })).body.id).toBe(
    first.body.id,
  )
})

test('timeout após criação permite recuperar a mesma tentativa', async ({ page }) => {
  const token = await loginApi(page)
  await page.evaluate(() => window.kurioMocks!.scenario('timeout-after-create'))
  const input = await prepareOrder(page, token, 'timeout-order')
  expect(
    (
      await api(page, '/api/orders', {
        method: 'POST',
        token,
        key: input.idempotencyKey,
        body: input,
      })
    ).status,
  ).toBe(504)
  const recovered = await api(page, `/api/orders/attempt/${input.idempotencyKey}`, { token })
  expect(recovered.status).toBe(200)
  const repeated = await api(page, '/api/orders', {
    method: 'POST',
    token,
    key: input.idempotencyKey,
    body: input,
  })
  expect(repeated.body.id).toBe(recovered.body.id)
})

test('pagamento confirmado consome cupom uma única vez e preserva recibo', async ({ page }) => {
  const token = await loginApi(page)
  const input = await prepareOrder(page, token, 'confirmado')
  await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: 'KURIO10' } })
  input.quoteId = (await api(page, '/api/cart/quote', { token })).body.id
  const order = await api(page, '/api/orders', {
    method: 'POST',
    token,
    key: input.idempotencyKey,
    body: input,
  })
  expect(order.status).toBe(201)
  await expect
    .poll(async () => (await api(page, `/api/orders/${order.body.id}`, { token })).body.status)
    .toBe('confirmed')
  const snapshot = (await api(page, `/api/orders/${order.body.id}`, { token })).body.snapshot
  expect(snapshot.quote.coupon).toBe('KURIO10')
  expect((await api(page, '/api/cart', { token })).body.items).toHaveLength(0)
  expect(
    (await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: ' kurio10 ' } }))
      .status,
  ).toBe(409)
  const other = await loginApi(page, 'test@kurio.test')
  expect(
    (
      await api(page, '/api/cart/coupon', {
        method: 'PUT',
        token: other,
        body: { code: 'KURIO10' },
      })
    ).status,
  ).toBe(200)
  await page.evaluate(() => window.kurioMocks!.changeNft('emerald-ape', { priceEth: '9' }))
  expect((await api(page, `/api/orders/${order.body.id}`, { token })).body.snapshot).toEqual(
    snapshot,
  )
})

test('pagamento recusado preserva itens e libera cupom', async ({ page }) => {
  const token = await loginApi(page)
  await page.evaluate(() => window.kurioMocks!.scenario('payment-declined'))
  const input = await prepareOrder(page, token, 'recusado')
  await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: 'KURIO10' } })
  input.quoteId = (await api(page, '/api/cart/quote', { token })).body.id
  const order = await api(page, '/api/orders', {
    method: 'POST',
    token,
    key: input.idempotencyKey,
    body: input,
  })
  expect(order.status).toBe(201)
  expect(
    (await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: 'KURIO10' } }))
      .status,
  ).toBe(409)
  await expect
    .poll(async () => (await api(page, `/api/orders/${order.body.id}`, { token })).body.status)
    .toBe('declined')
  expect((await api(page, '/api/cart', { token })).body.items).toHaveLength(1)
  expect(
    (await api(page, '/api/cart/coupon', { method: 'PUT', token, body: { code: 'KURIO10' } }))
      .status,
  ).toBe(200)
})
