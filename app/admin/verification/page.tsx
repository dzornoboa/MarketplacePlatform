import { requireCapability } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { dateTime, money } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { reviewVerification } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const QUEUES = ['pending_review', 'verified', 'changes_requested', 'rejected'] as const

export default async function AdminVerificationPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('verification')
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const error = str('error') || null, message = str('message') || null
  const status = QUEUES.includes(str('status') as 'pending_review') ? str('status') : 'pending_review'
  const q = str('q').trim()
  const type = str('type')
  const sort = str('sort') === 'newest' ? 'newest' : 'oldest'

  const { data: requests } = await supabase.from('verification_requests').select('*')
    .eq('status', status as 'pending_review').order('submitted_at', { ascending: sort === 'oldest' }).limit(200)
  const userIds = [...new Set((requests ?? []).map(r => r.user_id))]

  const [{ data: profiles }, { data: documents }, { data: orgMembers }, { data: plans }] = await Promise.all([
    userIds.length ? supabase.from('profiles').select('*').in('id', userIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('document_records').select('id,owner_user_id,file_name,purpose,created_at').in('owner_user_id', userIds).in('purpose', ['identity', 'business_certificate', 'profile']) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('organization_members').select('user_id,organization_id').in('user_id', userIds) : Promise.resolve({ data: [] }),
    supabase.from('subscription_plans').select('code,name,price_usd'),
  ])
  const orgIds = [...new Set((orgMembers ?? []).map(m => m.organization_id))]
  const { data: orgs } = orgIds.length ? await supabase.from('organizations').select('id,name,registration_number,website,country,is_verified').in('id', orgIds) : { data: [] }
  const orgByUser = new Map((orgMembers ?? []).map(m => [m.user_id, (orgs ?? []).find(o => o.id === m.organization_id)]))
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const planByCode = new Map((plans ?? []).map(p => [p.code, p]))
  const counts = await Promise.all(QUEUES.map(async s => ({ s, n: (await supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', s)).count ?? 0 })))

  const visible = (requests ?? []).filter(r => {
    const p = profileMap.get(r.user_id)
    if (!p) return false
    if (q && !p.full_name.toLowerCase().includes(q.toLowerCase())) return false
    if (type && p.requested_participant_type !== type) return false
    return true
  })

  return <div className="page-stack">
    <RealtimeRefresh tables={["verification_requests","profiles","document_records"]} />
    <div>
      <p className="eyebrow">Verification queue</p>
      <h1>Review member applications</h1>
      <p className="muted">Approval assigns the participant type, activates the account, and starts the plan they chose — free plans immediately, paid plans once payment is received.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">{counts.map(c => <a key={c.s} className={c.s === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/verification?status=${c.s}`}>{humanize(c.s)}<span>{c.n}</span></a>)}</nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Name<input name="q" defaultValue={q} placeholder="Search applicants" /></label>
      <label>Participant type
        <select name="type" defaultValue={type}>
          <option value="">All types</option>
          {['investor', 'buyer', 'business', 'project_sponsor', 'wtc_association_member', 'wtc_accra_member', 'institutional_partner'].map(t => <option key={t} value={t}>{labelForParticipantType(t)}</option>)}
        </select>
      </label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="oldest">Oldest first</option><option value="newest">Newest first</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {visible.length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>{q || type ? 'No applications match' : 'Queue is clear'}</h2><p>{q || type ? 'Widen the filters.' : `No applications with status “${humanize(status)}”.`}</p></section>
      : <div className="review-list">{visible.map(request => {
          const profile = profileMap.get(request.user_id)!
          const org = orgByUser.get(request.user_id)
          const docs = (documents ?? []).filter(d => d.owner_user_id === request.user_id)
          const plan = profile.requested_plan_code ? planByCode.get(profile.requested_plan_code) : null
          const hasIdentity = docs.some(d => d.purpose === 'identity')
          const hasCert = docs.some(d => d.purpose === 'business_certificate')
          return <article className="card review-card" key={request.id}>
            <div className="review-head">
              <div>
                <h2><a href={`/admin/users/${profile.id}`}>{profile.full_name || 'Unnamed user'}</a></h2>
                <p>{labelForParticipantType(profile.requested_participant_type)} · {profile.country || 'Country not provided'}{org ? ` · ${org.name}` : ''}</p>
              </div>
              <span>{dateTime(request.submitted_at)}</span>
            </div>

            <dl className="detail-grid">
              <div><dt>Phone</dt><dd>{profile.phone || '—'}</dd></div>
              <div><dt>Job title</dt><dd>{profile.job_title || '—'}</dd></div>
              <div><dt>City</dt><dd>{profile.city || '—'}</dd></div>
              <div><dt>Chosen plan</dt><dd>{plan ? `${plan.name} · ${Number(plan.price_usd) === 0 ? 'Free' : money(plan.price_usd)}` : 'Not chosen yet'}</dd></div>
            </dl>

            {org && <dl className="detail-grid">
              <div><dt>Organisation</dt><dd>{org.name}</dd></div>
              <div><dt>Registration no.</dt><dd>{org.registration_number || '—'}</dd></div>
              <div><dt>Website</dt><dd>{org.website ? <a className="arrow-link" href={org.website} target="_blank" rel="noopener">{org.website}</a> : '—'}</dd></div>
              <div><dt>Org verified</dt><dd>{org.is_verified ? 'Yes' : 'Not yet'}</dd></div>
            </dl>}

            <div className="item-editor">
              <h3>Documents</h3>
              {docs.length === 0
                ? <p className="field-help">No verification documents uploaded.</p>
                : <div className="history-list">{docs.map(d => <div key={d.id}>
                    <strong>{d.file_name}</strong><span>{dateTime(d.created_at)}</span>
                    <p className="muted">{humanize(d.purpose)} · <a className="arrow-link" href={`/api/documents/${d.id}`} target="_blank" rel="noopener">Open →</a></p>
                  </div>)}</div>}
              <p className="field-help">
                Identity: {hasIdentity ? '✓ provided' : '✗ missing'}{['business', 'project_sponsor', 'institutional_partner', 'wtc_association_member', 'wtc_accra_member'].includes(profile.requested_participant_type ?? '') ? ` · Business certificate: ${hasCert ? '✓ provided' : '✗ missing'}` : ''}
              </p>
            </div>

            {request.submission_note && <p className="field-help">Applicant note: {request.submission_note}</p>}
            {request.reviewer_note && status !== 'pending_review' && <p className="field-help">Reviewer note: {request.reviewer_note}</p>}

            {status === 'pending_review' && <form action={reviewVerification} className="review-form">
              <input type="hidden" name="requestId" value={request.id} />
              <label>Reviewer note<textarea name="note" rows={3} placeholder="Shown to the applicant for changes and rejections." /></label>
              <div className="button-row">
                <button className="button button-primary" name="decision" value="approve">Approve — grant verified check</button>
                <button className="button button-secondary" name="decision" value="changes">Request changes</button>
                <button className="button button-danger" name="decision" value="reject">Reject</button>
              </div>
            </form>}
          </article>
        })}</div>}
  </div>
}
