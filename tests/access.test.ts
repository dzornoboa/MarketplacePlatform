import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canUseVerifiedFeatures,
  canShowPublicDealDetails,
  type AccessState,
  dashboardRestrictionReason,
  isAdminRole,
  isKnownParticipantType,
  isStaffRole,
  hasAdminMfaAccess,
  hasCapability,
} from '../lib/auth/access.ts'

test('roles and verification gates',()=>{
  assert.equal(isAdminRole('admin'),true)
  assert.equal(isAdminRole('user'),false)
  assert.equal(isStaffRole('trade_officer'),true)
  assert.equal(canUseVerifiedFeatures('verified'),true)
  assert.equal(canUseVerifiedFeatures('pending_review'),false)
  assert.match(dashboardRestrictionReason('pending_profile')??'',/complete/i)
  assert.equal(isKnownParticipantType('super_admin'),false)
  assert.equal(hasAdminMfaAccess('admin','aal2'),true)
  assert.equal(hasAdminMfaAccess('admin','aal1'),false)
})

test('staff role capabilities stay aligned with the staff console',()=>{
  assert.equal(hasCapability('trade_officer','opportunities'),true)
  assert.equal(hasCapability('trade_officer','matching'),true)
  assert.equal(hasCapability('trade_officer','introductions'),true)
  assert.equal(hasCapability('trade_officer','reports'),true)
  assert.equal(hasCapability('trade_officer','finance'),false)

  assert.equal(hasCapability('verification_officer','verification'),true)
  assert.equal(hasCapability('verification_officer','users'),true)
  assert.equal(hasCapability('verification_officer','opportunities'),false)

  assert.equal(hasCapability('content_manager','content'),true)
  assert.equal(hasCapability('content_manager','users'),false)

  assert.equal(hasCapability('finance','finance'),true)
  assert.equal(hasCapability('finance','reports'),true)
  assert.equal(hasCapability('finance','verification'),false)

  assert.equal(hasCapability('support','support'),true)
  assert.equal(hasCapability('support','finance'),false)

  for (const capability of ['verification','opportunities','matching','introductions','finance','content','support','reports','users'] as const) {
    assert.equal(hasCapability('admin', capability), true)
    assert.equal(hasCapability('super_admin', capability), true)
  }
})

test('public deal details require an active account and the applicable access grant', () => {
  const active: AccessState = {
    account_status: 'active',
    verification_status: 'verified',
    participant_type: 'business',
    can_view_opportunities: true,
    can_post_opportunities: true,
    has_active_subscription: false,
    subscription_ends_at: null,
  }
  assert.equal(canShowPublicDealDetails(null), false)
  assert.equal(canShowPublicDealDetails({ ...active, account_status: 'pending', verification_status: 'pending_review', can_view_deal_details: true }), false)
  assert.equal(canShowPublicDealDetails(active), false)
  assert.equal(canShowPublicDealDetails({ ...active, has_active_subscription: true }), false)
  assert.equal(canShowPublicDealDetails({ ...active, has_active_subscription: true, can_view_deal_details: true }), true)
  assert.equal(canShowPublicDealDetails({ ...active, can_view_opportunities: false, can_view_deal_details: true }), false)
})
