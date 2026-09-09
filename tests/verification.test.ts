import test from 'node:test'
import assert from 'node:assert/strict'
import { reviewDecisionToStatus } from '../lib/auth/verification.ts'
test('verification decision allowlist',()=>{assert.equal(reviewDecisionToStatus('approve'),'verified');assert.equal(reviewDecisionToStatus('changes'),'changes_requested');assert.equal(reviewDecisionToStatus('reject'),'rejected');assert.equal(reviewDecisionToStatus('admin'),null)})
