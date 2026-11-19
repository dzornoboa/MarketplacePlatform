import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyTransaction } from '../lib/payments/paystack.ts'

test('provider verification preserves pending status and rejects unconfirmed references', async t => {
  const result = { status: true, data: { status: 'pending', id: 42, amount: 10000, currency: 'USD', reference: 'payment-1' } }
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(result))
  assert.deepEqual(await verifyTransaction('payment-1'), {
    status: 'pending', providerReference: '42', amountMinor: 10000, currency: 'USD',
  })
  assert.equal(await verifyTransaction('payment-2'), null)
  fetch.mock.mockImplementation(async () => Response.json({ status: false }, { status: 503 }))
  assert.equal(await verifyTransaction('payment-1'), null)
})
