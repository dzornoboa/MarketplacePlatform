import Link from 'next/link'
import { remindConnection, respondToConnection } from '@/app/dashboard/feed/actions'
import { connectionLabel, type ConnectionState } from '@/lib/connections'

export function ConnectionStatus({ row, viewer, returnTo }: { row: ConnectionState; viewer: string; returnTo: string }) {
  return <div className="button-row">
    <span className={row.status === 'accepted' ? 'status-dot status-verified' : 'status-dot'}>{connectionLabel(row, viewer)}</span>
    {row.status === 'pending' && (row.requester_id === viewer
      ? <form action={respondToConnection} className="button-row">
          <input type="hidden" name="connectionId" value={row.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="link-button link-button-danger" name="decision" value="withdraw">Withdraw</button>
          {row.staff_approved_at && <button className="link-button" formAction={remindConnection}>Send reminder</button>}
        </form>
      : <Link className="text-link" href={`/dashboard/network#request-${row.id}`}>Review request</Link>)}
  </div>
}
