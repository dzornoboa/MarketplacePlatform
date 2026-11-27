import assert from 'node:assert/strict'
import test from 'node:test'
import { notificationDestination } from '../lib/notifications/destination.ts'

test('legacy welcome notifications open profile setup in the inbox and in push', () => {
  const title = 'Welcome to the WTC Accra Hub'
  assert.equal(notificationDestination({ kind: 'welcome', title, href: '/dashboard' }), '/dashboard/profile')
  assert.equal(notificationDestination({ title, href: '/dashboard' }), '/dashboard/profile')
  assert.equal(notificationDestination({ kind: 'welcome', title, href: '/dashboard/verification' }), '/dashboard/verification')
})

test('staff support links select the ticket independently of its queue status', () => {
  const id = '00000000-0000-4000-8000-000000000001'
  assert.equal(notificationDestination({ title: 'Review', href: `/admin/support#request-${id}` }), `/admin/support?request=${id}#request-${id}`)
})

test('specific routes and anchors survive while unsafe destinations are discarded', () => {
  for (const href of ['/dashboard/billing#kyc', '/admin/deals?section=connections', '/dashboard/deal-rooms/123']) {
    assert.equal(notificationDestination({ title: 'Update', href }), href)
  }
  assert.equal(notificationDestination({ title: 'Update', href: '//example.test' }), '')
})
