export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'
export const connectionColumns = 'id,requester_id,addressee_id,status,staff_approved_at,created_at,updated_at' as const

export type ConnectionState = {
  id: string
  requester_id: string
  addressee_id: string
  status: ConnectionStatus
  staff_approved_at: string | null
  created_at: string
  updated_at: string
}

export function connectionByMember<T extends ConnectionState>(rows: T[], viewer: string): Map<string, T> {
  const rank = { accepted: 3, pending: 2, declined: 1, withdrawn: 1 }
  const result = new Map<string, T>()
  for (const row of rows) {
    const outgoing = row.requester_id === viewer
    if (!outgoing && (row.addressee_id !== viewer || (!row.staff_approved_at && row.status !== 'accepted'))) continue
    const other = outgoing ? row.addressee_id : row.requester_id
    const current = result.get(other)
    if (!current || rank[row.status] > rank[current.status]
      || (rank[row.status] === rank[current.status] && row.updated_at > current.updated_at)) result.set(other, row)
  }
  return result
}

export function connectionLabel(row: ConnectionState, viewer: string) {
  if (row.status === 'accepted') return 'Connected'
  if (row.status === 'declined') return 'Declined'
  if (row.status === 'withdrawn') return 'Withdrawn'
  if (!row.staff_approved_at) return 'Awaiting WTC Accra review'
  return row.requester_id === viewer ? 'Awaiting recipient' : 'Awaiting your reply'
}
