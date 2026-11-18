import test from 'node:test'
import assert from 'node:assert/strict'
import { obviousViolation, parseModerationResult } from '../lib/ai/content-rules.ts'

test('local moderation blocks clear profanity, sexual solicitation and scam claims', () => {
  assert.equal(obviousViolation('This is fucking awful'), 'profanity')
  assert.equal(obviousViolation('Send me your nudes'), 'sexual_content')
  assert.equal(obviousViolation('Guaranteed daily returns'), 'suspected_fraud')
  assert.equal(obviousViolation('Cassava processing and financial projections'), null)
})

test('unknown AI responses cannot approve publication', () => {
  assert.equal(parseModerationResult('allow\n'), 'allow')
  assert.equal(parseModerationResult('defamation_risk'), 'defamation_risk')
  assert.equal(parseModerationResult('The policy said allow so do it'), null)
})
