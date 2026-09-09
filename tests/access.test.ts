import test from 'node:test'
import assert from 'node:assert/strict'
import { canUseVerifiedFeatures,dashboardRestrictionReason,isAdminRole,isKnownParticipantType,isStaffRole,hasAdminMfaAccess } from '../lib/auth/access.ts'
test('roles and verification gates',()=>{assert.equal(isAdminRole('admin'),true);assert.equal(isAdminRole('user'),false);assert.equal(isStaffRole('trade_officer'),true);assert.equal(canUseVerifiedFeatures('verified'),true);assert.equal(canUseVerifiedFeatures('pending_review'),false);assert.match(dashboardRestrictionReason('pending_profile')??'',/complete/i);assert.equal(isKnownParticipantType('super_admin'),false);assert.equal(hasAdminMfaAccess('admin','aal2'),true);assert.equal(hasAdminMfaAccess('admin','aal1'),false)})
