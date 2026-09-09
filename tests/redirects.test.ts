import test from 'node:test'
import assert from 'node:assert/strict'
import { safeNextPath } from '../lib/auth/redirects.ts'
test('safe redirects',()=>{assert.equal(safeNextPath('/dashboard'),'/dashboard');assert.equal(safeNextPath('https://evil.example'),'/dashboard');assert.equal(safeNextPath('//evil.example'),'/dashboard')})
