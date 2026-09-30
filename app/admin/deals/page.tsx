import Link from 'next/link'
import { requireAnyCapability } from '@/lib/auth/guards'
import { Avatar } from '@/components/avatar'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { money, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { reviewDeal, reviewConnectionRequest } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const QUEUES = [
  { key: 'submitted', label: 'Processing' },
  { key: 'under_review', label: 'Processed' },
  { key: 'accepted', label: 'Connected' },
  { key: 'declined', label: 'Declined' },
  { key: 'withdrawn', label: 'Withdrawn' },
] as const

export default async function AdminDealsPage({ searchParams }: Props) {
  const { supabase } = await requireAnyCapability(['opportunities', 'verification'])
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' && QUEUES.some(q => q.key === params.status) ? params.status : 'submitted'
  const section = typeof params.section === 'string' ? params.section : 'deals'
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const sort = typeof params.sort === 'string' && ['newest', 'oldest'].includes(params.sort) ? params.sort : 'oldest'

  const { data: allDeals } = await supabase.from('expressions_of_interest')
    .select('*').eq('status', status as 'submitted').order('created_at', { ascending: sort === 'oldest' }).limit(1000)

  const oppIds = [...new Set((allDeals ?? []).map(row => row.opportunity_id))]
  const applicantIds = [...new Set((allDeals ?? []).map(row => row.applicant_id))]
  const actionIds = [...new Set((allDeals ?? []).map(row => row.last_action_by).filter((id): id is string => !!id))]
  const [{ data: opportunities }, { data: applicants }, { data: actors }] = await Promise.all([
    oppIds.length ? supabase.from('opportunities').select('id,title,sector,country,owner_user_id,capital_required,currency').in('id', oppIds) : Promise.resolve({ data: [] }),
    applicantIds.length ? supabase.from('profiles').select('id,full_name,participant_type,country,verification_status,avatar_url').in('id', applicantIds) : Promise.resolve({ data: [] }),
    actionIds.length ? supabase.from('profiles').select('id,full_name,system_role').in('id', actionIds) : Promise.resolve({ data: [] }),
  ])
  const ownerIds = [...new Set((opportunities ?? []).map(o => o.owner_user_id))]
  const { data: owners } = ownerIds.length ? await supabase.from('profiles').select('id,full_name').in('id', ownerIds) : { data: [] }

  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))
  const applicantById = new Map((applicants ?? []).map(a => [a.id, a]))
  const ownerById = new Map((owners ?? []).map(o => [o.id, o]))
  const actorById = new Map((actors ?? []).map(a => [a.id, a]))

  const needle = q.toLowerCase()
  const deals = (allDeals ?? []).filter(row => !needle
    || (oppById.get(row.opportunity_id)?.title ?? '').toLowerCase().includes(needle)
    || (applicantById.get(row.applicant_id)?.full_name ?? '').toLowerCase().includes(needle))

  const { data: connectionQueue } = await supabase.from('connections')
    .select('id,requester_id,addressee_id,opportunity_id,intent,message,status,staff_approved_at,created_at')
    .eq('status','pending')
    .is('staff_approved_at',null)
    .order('created_at',{ascending:true})
    .limit(1000)

  const connectionPeopleIds = [...new Set((connectionQueue ?? []).flatMap(row => [row.requester_id,row.addressee_id]))]
  const connectionOppIds = [...new Set((connectionQueue ?? []).map(row => row.opportunity_id).filter((id): id is string => !!id))]
  const [{ data: connectionPeople }, { data: connectionOpps }] = await Promise.all([
    connectionPeopleIds.length ? supabase.from('profiles').select('id,full_name,participant_type,country,verification_status').in('id',connectionPeopleIds) : Promise.resolve({data:[]}),
    connectionOppIds.length ? supabase.from('opportunities').select('id,title,sector,country').in('id',connectionOppIds) : Promise.resolve({data:[]}),
  ])
  const connectionPersonById = new Map((connectionPeople ?? []).map(person => [person.id,person]))
  const connectionOppById = new Map((connectionOpps ?? []).map(opp => [opp.id,opp]))

  const counts = await Promise.all(QUEUES.map(async tab => ({
    ...tab,
    count: (await supabase.from('expressions_of_interest').select('*', { count: 'exact', head: true }).eq('status', tab.key)).count ?? 0,
  })))

  return <div className="page-stack">
    <RealtimeRefresh tables={['expressions_of_interest']} />
    <div>
      <p className="eyebrow">Monitored Deal Workflow</p>
      <h1>Deals</h1>
      <p className="muted">Deal requests are monitored by Trade Officers, Verification Officers, Administrators and Super Administrators. Status changes are shared globally and identify the staff member who authorised them.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">
      <a className={section === 'deals' ? 'queue-tab queue-tab-active' : 'queue-tab'} href="/admin/deals">Deal Requests</a>
      <a className={section === 'connections' ? 'queue-tab queue-tab-active' : 'queue-tab'} href="/admin/deals?section=connections">Connection Approvals<span>{(connectionQueue ?? []).length}</span></a>
    </nav>

    {section === 'connections' && <section className="page-stack">
      {(connectionQueue ?? []).length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>Connection Queue Is Clear</h2><p>No member-to-member connection requests are waiting for WTC Accra approval.</p></section>
        : <div className="review-list">{(connectionQueue ?? []).map(request => {
            const from = connectionPersonById.get(request.requester_id)
            const to = connectionPersonById.get(request.addressee_id)
            const opp = request.opportunity_id ? connectionOppById.get(request.opportunity_id) : null
            return <article className="card review-card" key={request.id}>
              <div className="review-head">
                <div>
                  <h2>{from?.full_name ?? 'Member'} → {to?.full_name ?? 'Member'}</h2>
                  <p>{humanize(request.intent)} request{opp ? ` · ${opp.title}` : ' · General connection'}</p>
                </div>
                <span>{dateTime(request.created_at)}</span>
              </div>
              <dl className="detail-grid">
                <div><dt>Requester</dt><dd>{from?.full_name ?? '—'} · {labelForParticipantType(from?.participant_type)}</dd></div>
                <div><dt>Recipient</dt><dd>{to?.full_name ?? '—'} · {labelForParticipantType(to?.participant_type)}</dd></div>
                <div><dt>Requester Verification</dt><dd>{humanize(from?.verification_status)}</dd></div>
                <div><dt>Recipient Verification</dt><dd>{humanize(to?.verification_status)}</dd></div>
              </dl>
              {opp && <p className="muted">{opp.sector} · {opp.country}</p>}
              {request.message && <p className="prose">{request.message}</p>}
              <form action={reviewConnectionRequest} className="review-form">
                <input type="hidden" name="connectionId" value={request.id} />
                <label>Review Note<textarea name="reviewNote" rows={2} placeholder="Optional audit note" /></label>
                <div className="button-row">
                  <button className="button button-primary" name="decision" value="approve">Approve Connection Request</button>
                  <button className="button button-danger" name="decision" value="decline">Decline</button>
                </div>
              </form>
            </article>
          })}</div>}
    </section>}

    {section === 'deals' && <>
    <nav className="queue-tabs">
      {counts.map(tab => <a key={tab.key} className={tab.key === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/deals?status=${tab.key}`}>{tab.label}<span>{tab.count}</span></a>)}
    </nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Search<input name="q" defaultValue={q} placeholder="Deal, listing or participant" /></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="oldest">Oldest First</option><option value="newest">Newest First</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {deals.length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>{q ? 'No Matching Deals' : 'Queue Is Clear'}</h2><p>No deal requests are currently in “{QUEUES.find(tab => tab.key === status)?.label}”.</p></section>
      : <div className="review-list">{deals.map(deal => {
          const opp = oppById.get(deal.opportunity_id)
          const applicant = applicantById.get(deal.applicant_id)
          const owner = opp ? ownerById.get(opp.owner_user_id) : undefined
          const actor = deal.last_action_by ? actorById.get(deal.last_action_by) : undefined
          return <article className="card review-card" key={deal.id}>
            <div className="review-head">
              <div>
                <h2>{opp?.title ?? 'Deal Opportunity'}</h2>
                <p>{opp ? `${opp.sector} · ${opp.country} · ${money(opp.capital_required, opp.currency)} · Owner ${owner?.full_name ?? '—'}` : ''}</p>
              </div>
              <span>{dateTime(deal.created_at)}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>Applicant</dt><dd className="avatar-stack"><Avatar src={applicant?.avatar_url} name={applicant?.full_name} size={26} /><Link href={`/admin/users/${deal.applicant_id}`}>{applicant?.full_name ?? 'Member'}</Link></dd></div>
              <div><dt>Participant Type</dt><dd>{labelForParticipantType(applicant?.participant_type)}</dd></div>
              <div><dt>Verification</dt><dd>{humanize(applicant?.verification_status)}</dd></div>
              <div><dt>Country</dt><dd>{applicant?.country ?? '—'}</dd></div>
            </dl>
            <p className="prose">{deal.message}</p>
            {deal.owner_note && <p className="field-help">Workflow Note: {deal.owner_note}</p>}
            {actor && <p className="field-help">Last authorised by <strong>{actor.full_name}</strong> · {humanize(deal.last_action_role || actor.system_role)} · {deal.last_action_at ? dateTime(deal.last_action_at) : ''}</p>}
            {status === 'submitted' && <form action={reviewDeal} className="review-form">
              <input type="hidden" name="dealId" value={deal.id} />
              <label>Review Note<textarea name="reviewNote" rows={2} placeholder="Recorded in the audit log and shown where applicable." /></label>
              <div className="button-row">
                <button className="button button-primary" name="decision" value="clear">Mark Processed</button>
                <button className="button button-danger" name="decision" value="reject">Decline</button>
              </div>
            </form>}
          </article>
        })}</div>}
    </>}
  </div>
}
