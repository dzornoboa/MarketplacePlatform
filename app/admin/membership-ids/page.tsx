import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { dateTime, date } from '@/lib/format'
import { SubmitButton } from '@/components/submit-button'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { CopyMembershipIds } from '@/components/copy-membership-ids'
import { generateMembershipId, assignMembershipId, revokeMembershipId, importMembershipRoster, activateImportedMembers } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> }

const typeLabel = (code: string) => code === 'wtca' ? 'WTCA Member' : 'WTC Accra Member'

export default async function MembershipIdsPage({ searchParams }: Props) {
  const { supabase, capabilities } = await requireCapability('membership_ids')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const type = typeof params.type === 'string' ? params.type : ''
  const batchId = typeof params.batch === 'string' ? params.batch : ''
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  let query = supabase.from('membership_access_ids').select('*').order('created_at',{ascending:false}).limit(1000)
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('membership_type_code', type)
  if (q) query = query.or(`code.ilike.%${q}%,assigned_email.ilike.%${q}%`)
  const { data: ids } = await query

  const userIds = [...new Set((ids ?? []).map(row => row.assigned_user_id).filter((id): id is string => !!id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id,full_name,username,participant_type,verification_status,account_status').in('id',userIds)
    : { data: [] }
  const profileById = new Map((profiles ?? []).map(p => [p.id,p]))

  const { data: batches } = await supabase.from('membership_import_batches').select('*').order('created_at',{ascending:false}).limit(20)
  const activeBatchId = batchId || batches?.[0]?.id || ''
  const { data: importRows } = activeBatchId
    ? await supabase.from('membership_import_rows').select('*').eq('batch_id',activeBatchId).order('row_number')
    : { data: [] }
  const activeBatch = (batches ?? []).find(b => b.id === activeBatchId)
  const copyLines = (importRows ?? []).filter(r => r.member_code).map(r => `${r.full_name}\t${r.email}\t${r.member_code}`)

  return <div className="page-stack">
    <RealtimeRefresh tables={['membership_access_ids','membership_import_batches','membership_import_rows','profiles']} />
    <div>
      <p className="eyebrow">Membership Administration</p>
      <h1>Membership IDs</h1>
      <p className="muted">WTC Accra Members use <strong>WTCA##########</strong>. World Trade Centers Association Members use <strong>WTCAM##########</strong>. IDs are unique, email-bound and must be activated before registration.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="split-grid">
      <form action={generateMembershipId} className="card form-stack">
        <h2>Generate Membership ID</h2>
        <label>Membership Type<select name="memberType" defaultValue="wtc_accra"><option value="wtc_accra">WTC Accra Member</option><option value="wtca">WTCA Member</option></select></label>
        <label>Member Email (Optional)<input name="email" type="email" placeholder="member@example.com" /></label>
        <label>Internal Note<textarea name="note" rows={2} placeholder="Membership confirmation or reference" /></label>
        <p className="field-help">Supplying an email activates the ID for that address immediately. Existing matching accounts are linked automatically.</p>
        <SubmitButton pendingLabel="Generating…">Generate ID</SubmitButton>
      </form>

      <form action={assignMembershipId} className="card form-stack">
        <h2>Assign / Activate Existing ID</h2>
        <label>Membership ID<input name="code" pattern="(?:WTCA|WTCAM)[0-9]{10}" placeholder="WTCA4567679989 or WTCAM7856574110" required /></label>
        <label>Member Email<input name="email" type="email" required /></label>
        <SubmitButton pendingLabel="Activating…">Activate And Email ID</SubmitButton>
      </form>
    </section>

    <section className="card form-stack">
      <div>
        <p className="eyebrow">Bulk Member Onboarding</p>
        <h2>Import Members From Excel</h2>
        <p className="muted">Upload an <strong>.xlsx</strong> workbook or CSV. Uploading only prepares IDs; no account is active until an administrator activates selected rows or the whole reviewed batch.</p>
        <p><a className="button button-outline" href="/api/admin/membership-import/template">Download Excel Template</a></p>
      </div>
      <form action={importMembershipRoster} className="form-grid">
        <label>Membership Type<select name="memberType" required defaultValue="wtc_accra"><option value="wtc_accra">WTC Accra Member</option><option value="wtca">WTCA Member</option></select></label>
        <label>Excel / CSV File<input name="file" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" required /></label>
        <SubmitButton pendingLabel="Importing…">Upload And Prepare IDs</SubmitButton>
      </form>
      <p className="field-help">Required columns: <strong>full_name, email, organisation_name, country, country_code, date_of_birth, id_type, id_number</strong>. Optional columns: phone, city, job_title, wtca_chapter, preferred_currency. Accepted ID types: national_id, passport, drivers_license, voter_id, residence_permit, other.</p>
    </section>

    {(batches ?? []).length > 0 && <section className="card form-stack">
      <div className="review-head">
        <div><h2>Imported Membership Batches</h2><p className="muted">Review prepared IDs before activation.</p></div>
        <form method="get">
          <label>Batch<select name="batch" defaultValue={activeBatchId}>{(batches ?? []).map(batch => <option key={batch.id} value={batch.id}>{dateTime(batch.created_at)} · {typeLabel(batch.membership_type_code)} · {batch.file_name}</option>)}</select></label>
          <button className="button button-outline" type="submit">Open Batch</button>
        </form>
      </div>
      {activeBatch && <div className="pill-row">
        <span className="status-dot">Rows {activeBatch.row_count}</span>
        <span className="status-dot">Ready {activeBatch.ready_count}</span>
        <span className="status-dot status-verified">Activated {activeBatch.activated_count}</span>
      </div>}
      <div className="button-row">
        <CopyMembershipIds lines={copyLines} />
        {activeBatchId && <a className="button button-outline" href={`/api/admin/membership-import/${activeBatchId}/export`}>Export CSV</a>}
      </div>

      {activeBatchId && <form action={activateImportedMembers}>
        <input type="hidden" name="batchId" value={activeBatchId} />
        {capabilities.has('verification') && <label className="check-row"><input type="checkbox" name="markVerified" /> <span>Also mark activated accounts WTC Accra Verified</span></label>}
        <div className="button-row">
          <SubmitButton name="mode" value="selected" pendingLabel="Activating…">Activate Selected</SubmitButton>
          <SubmitButton name="mode" value="all" className="button button-secondary" pendingLabel="Activating…">Activate All Ready Rows</SubmitButton>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Select</th><th>Row</th><th>Member</th><th>Type</th><th>Prepared ID</th><th>Status</th><th>Issue</th></tr></thead>
            <tbody>{(importRows ?? []).map(row => <tr key={row.id}>
              <td>{['prepared','error','inviting'].includes(row.status) ? <input type="checkbox" name="rowId" value={row.id} aria-label={`Select ${row.full_name}`} /> : '—'}</td>
              <td>{row.row_number}</td>
              <td><strong>{row.full_name || 'Missing Name'}</strong><br/><small>{row.email}</small><br/><small>{row.organisation_name ?? '—'}</small></td>
              <td>{typeLabel(row.membership_type_code)}</td>
              <td><strong>{row.member_code ?? 'Not generated'}</strong></td>
              <td><span className={`status-dot status-${row.status}`}>{row.status}</span></td>
              <td>{row.validation_error ?? row.activation_error ?? '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </form>}
    </section>}

    <form className="filter-row card" method="get">
      <label>Search<input name="q" defaultValue={q} placeholder="Membership ID or email" /></label>
      <label>Type<select name="type" defaultValue={type}><option value="">All</option><option value="wtc_accra">WTC Accra Member</option><option value="wtca">WTCA Member</option></select></label>
      <label>Status<select name="status" defaultValue={status}><option value="">All</option><option value="available">Available</option><option value="prepared">Prepared</option><option value="assigned">Activated / Assigned</option><option value="used">Used</option><option value="revoked">Revoked</option></select></label>
      <button className="button button-outline" type="submit">Filter</button>
    </form>

    <section className="card table-wrap">
      <h2>Membership ID Register</h2>
      {(ids ?? []).length === 0 ? <p className="muted">No Membership IDs match the current filters.</p> : <table className="data-table">
        <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Assigned Email</th><th>Linked Account</th><th>Created</th><th>Used</th><th>Actions</th></tr></thead>
        <tbody>{(ids ?? []).map(row => {
          const person = row.assigned_user_id ? profileById.get(row.assigned_user_id) : null
          return <tr key={row.id}>
            <td><strong>{row.code}</strong>{row.note && <><br/><small>{row.note}</small></>}</td>
            <td>{typeLabel(row.membership_type_code)}</td>
            <td><span className={`status-dot status-${row.status}`}>{row.status}</span></td>
            <td>{row.assigned_email ?? '—'}</td>
            <td>{person ? <><Link href={`/admin/users/${person.id}`}><strong>{person.full_name}</strong></Link><br/><small>@{person.username ?? 'no-username'} · {person.verification_status} · {person.account_status}</small></> : '—'}</td>
            <td>{dateTime(row.created_at)}</td>
            <td>{row.used_at ? date(row.used_at) : '—'}</td>
            <td>{row.status !== 'used' && row.status !== 'revoked' ? <details className="eoi-block"><summary>Manage</summary><div className="form-stack compact-review">
              <form action={assignMembershipId} className="form-stack">
                <input type="hidden" name="code" value={row.code}/>
                <label>Assign Email<input name="email" type="email" defaultValue={row.assigned_email ?? ''} required /></label>
                <SubmitButton pendingLabel="Activating…">Activate / Resend</SubmitButton>
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
