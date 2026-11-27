import assert from 'node:assert/strict'
import test from 'node:test'
import { friendlyAuthError } from '../lib/auth/errors.ts'

test('expired signup and cross-browser links lead to confirmation resend', () => {
  assert.equal(friendlyAuthError('otp_expired', null, null).path, '/verify-email')
  const crossBrowser = friendlyAuthError('exchange_failed', 'PKCE code verifier not found', 'signup')
  assert.equal(crossBrowser.path, '/verify-email')
  assert.match(crossBrowser.message, /same browser/)
  assert.equal(friendlyAuthError('otp_expired', null, 'recovery').path, '/forgot-password')
  assert.equal(friendlyAuthError('otp_expired', null, 'invite').path, '/login')
})
