import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchWithDeadline } from '../lib/auth/registration-email.ts'

test('registration email requests abort stalled upstream calls', async () => {
  const stalled: typeof fetch = async (_input, init) => {
    const signal = init?.signal
    assert.ok(signal)
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
  }
  await assert.rejects(fetchWithDeadline(10, stalled)('https://example.test'), { name: 'TimeoutError' })
})
