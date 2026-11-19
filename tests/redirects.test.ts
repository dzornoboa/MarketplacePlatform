import test from 'node:test'
import assert from 'node:assert/strict'
import { safeNextPath } from '../lib/auth/redirects.ts'
test('safe redirects',()=>{assert.equal(safeNextPath('/dashboard'),'/dashboard');assert.equal(safeNextPath('https://evil.example'),'/dashboard');assert.equal(safeNextPath('//evil.example'),'/dashboard')})

test('redirects reject browser-normalized external paths and preserve local queries', () => {
  assert.equal(safeNextPath('/\\example.test', '/dashboard/documents'), '/dashboard/documents')
  assert.equal(safeNextPath('/\n/example.test'), '/dashboard')
  assert.equal(safeNextPath('/dashboard/search?q=trade#results'), '/dashboard/search?q=trade#results')
})
