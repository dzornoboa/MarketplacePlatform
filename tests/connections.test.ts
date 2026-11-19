import test from 'node:test'
import assert from 'node:assert/strict'
import { connectionByMember, connectionLabel, type ConnectionState } from '../lib/connections.ts'

const row = (patch: Partial<ConnectionState> = {}): ConnectionState => ({
  id: 'base', requester_id: 'me', addressee_id: 'other', status: 'pending',
  created_at: '2026-11-01', updated_at: '2026-11-01', staff_approved_at: null, ...patch,
})

test('a newer pending deal does not replace an accepted relationship', () => {
  const accepted = row({ id: 'accepted', requester_id: 'other', addressee_id: 'me', status: 'accepted' })
  const newer = row({ updated_at: '2026-11-19' })
  assert.equal(connectionByMember([newer, accepted], 'me').get('other')?.id, accepted.id)
})

test('incoming requests are hidden until staff approval and statuses are directional', () => {
  const incoming = row({ requester_id: 'other', addressee_id: 'me' })
  assert.equal(connectionByMember([incoming], 'me').size, 0)
  const approved = { ...incoming, staff_approved_at: '2026-11-02' }
  assert.equal(connectionLabel(connectionByMember([approved], 'me').get('other')!, 'me'), 'Awaiting your reply')
  assert.equal(connectionLabel(approved, 'other'), 'Awaiting recipient')
})
