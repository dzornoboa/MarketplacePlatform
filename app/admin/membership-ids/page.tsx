import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { dateTime, date } from '@/lib/format'
import { SubmitButton } from '@/components/submit-button'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { generateMembershipId, assignMembershipId, revokeMembershipId } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> }

export default async function MembershipIdsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('membership_ids')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  let query = supabase.from('wtc_accra_membership_ids').select('*').order('created_at',{ascending:false}).limit(1000)
  if (status) query = query.eq('status', status)
  if (q) query = query.or(`code.ilike.%${q}%,assigned_email.ilike.%${q}%`)
  const { data: ids } = await query

  const userIds = [...new Set((ids ?? []).map(row => row.assigned_user_id).filter((id): id is string => !!id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id,full_name,username,participant_type,verification_status,account_status').in('id',userIds)
    : { data: [] }
  const profileById = new Map((profiles ?? []).map(p => [p.id,p]))

  return <div className="page-stack">
    <RealtimeRefresh tables={['wtc_accra_membership_ids','profiles']} />
    <div>
      <p className="eyebrow">WTC Accra Membership</p>
      <h1>Membership IDs</h1>
      <p className="muted">Generate, assign, search and track the unique IDs required to create WTC Accra Member accounts. IDs begin with WTCA and can only be used once by the email they were assigned to. Existing WTC Accra Member accounts are linked automatically when their email is used.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="split-grid">
      <form action={generateMembershipId} className="card form-stack">
        <h2>Generate Membership ID</h2>
        <label>Member Email (Optional)<input name="email" type="email" placeholder="member@example.com" /></label>
        <label>Internal Note<textarea name="note" rows={2} placeholder="Membership confirmation or reference" /></label>
        <p className="field-help">If an email is supplied, the ID is immediately assigned and queued for email delivery. If that email already belongs to a WTC Accra Member account, the ID is linked to that account automatically and marked used. Leave email blank to create an available ID for later assignment.</p>
        <SubmitButton pendingLabel="Generating…">Generate ID</SubmitButton>
      </form>

      <form action={assignMembershipId} className="card form-stack">
        <h2>Assign Existing ID</h2>
        <label>Membership ID<input name="code" pattern="WTCA[0-9]{10}" placeholder="WTCA4567679989" required /></label>
        <label>Member Email<input name="email" type="email" required /></label>
        <SubmitButton pendingLabel="Assigning…">Assign And Email ID</SubmitButton>
      </form>
    </section>

    <form className="filter-row card" method="get">
      <label>Search<input name="q" defaultValue={q} placeholder="Membership ID or email" /></label>
      <label>Status<select name="status" defaultValue={status}><option value="">All</option><option value="available">Available</option><option value="assigned">Assigned</option><option value="used">Used</option><option value="revoked">Revoked</option></select></label>
      <button className="button button-outline" type="submit">Filter</button>
    </form>

    <section className="card table-wrap">
      <h2>Membership ID Register</h2>
      {(ids ?? []).length === 0 ? <p className="muted">No Membership IDs match the current filters.</p> : <table className="data-table">
        <thead><tr><th>ID</th><th>Status</th><th>Assigned Email</th><th>Linked Account</th><th>Created</th><th>Used</th><th>Actions</th></tr></thead>
        <tbody>{(ids ?? []).map(row => {
          const person = row.assigned_user_id ? profileById.get(row.assigned_user_id) : null
          return <tr key={row.id}>
            <td><strong>{row.code}</strong>{row.note && <><br/><small>{row.note}</small></>}</td>
            <td><span className={`status-dot status-${row.status}`}>{row.status}</span></td>
            <td>{row.assigned_email ?? '—'}</td>
            <td>{person ? <><Link href={`/admin/users/${person.id}`}><strong>{person.full_name}</strong></Link><br/><small>@{person.username ?? 'no-username'} · {person.verification_status} · {person.account_status}</small></> : '—'}</td>
            <td>{dateTime(row.created_at)}</td>
            <td>{row.used_at ? date(row.used_at) : '—'}</td>
            <td>{row.status !== 'used' && row.status !== 'revoked' ? <details className="eoi-block"><summary>Manage</summary><div className="form-stack compact-review">
              <form action={assignMembershipId} className="form-stack">
                <input type="hidden" name="code" value={row.code}/>
                <label>Assign Email<input name="email" type="email" defaultValue={row.assigned_email ?? ''} required /></label>
                <SubmitButton pendingLabel="Assigning…">Assign / Resend</SubmitButton>
              </form>
              <form action={revokeMembershipId} className="form-stack danger-zone">
                <input type="hidden" name="code" value={row.code}/>
                <input name="reason" placeholder="Reason for revocation" />
                <SubmitButton className="button button-danger" pendingLabel="Revoking…">Revoke</SubmitButton>
              </form>
            </div></details> : '—'}</td>
          </tr>
        })}</tbody>
      </table>}
    </section>
  </div>
}
