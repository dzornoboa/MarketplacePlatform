import { requireCapability } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { money, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { reviewBid } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const QUEUES = [
  { key: 'submitted', label: 'Awaiting due diligence' },
  { key: 'under_review', label: 'Cleared — with owner' },
  { key: 'accepted', label: 'Accepted by owner' },
  { key: 'declined', label: 'Declined / rejected' },
  { key: 'withdrawn', label: 'Withdrawn' },
] as const

export default async function AdminBidsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('opportunities')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' && QUEUES.some(q => q.key === params.status) ? params.status : 'submitted'

  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const sort = typeof params.sort === 'string' && ['newest', 'oldest'].includes(params.sort) ? params.sort : 'oldest'

  let query = supabase.from('expressions_of_interest').select('*').eq('status', status as 'submitted').limit(200)
  const { data: allBids } = await query.order('created_at', { ascending: sort === 'oldest' })

  const oppIds = [...new Set((allBids ?? []).map(b => b.opportunity_id))]
  const userIds = [...new Set((allBids ?? []).map(b => b.applicant_id))]
  const [{ data: opportunities }, { data: applicants }] = await Promise.all([
    oppIds.length ? supabase.from('opportunities').select('id,title,sector,country,owner_user_id,capital_required,currency').in('id', oppIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('profiles').select('id,full_name,participant_type,country,verification_status').in('id', userIds) : Promise.resolve({ data: [] }),
  ])
  const ownerIds = [...new Set((opportunities ?? []).map(o => o.owner_user_id))]
  const { data: owners } = ownerIds.length
    ? await supabase.from('profiles').select('id,full_name').in('id', ownerIds) : { data: [] }
  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))
  const applicantById = new Map((applicants ?? []).map(a => [a.id, a]))
  const ownerById = new Map((owners ?? []).map(o => [o.id, o]))
  // Search matches the listing title or the bidder's name, so it runs after the lookups.
  const needle = q.toLowerCase()
  const bids = (allBids ?? []).filter(b => !needle
    || (oppById.get(b.opportunity_id)?.title ?? '').toLowerCase().includes(needle)
    || (applicantById.get(b.applicant_id)?.full_name ?? '').toLowerCase().includes(needle))

  const counts = await Promise.all(QUEUES.map(async q => {
    const { count } = await supabase.from('expressions_of_interest').select('*', { count: 'exact', head: true }).eq('status', q.key)
    return { ...q, count: count ?? 0 }
  }))

  return <div className="page-stack">
    <RealtimeRefresh tables={["expressions_of_interest"]} />
    <div>
      <p className="eyebrow">Trade desk</p>
      <h1>Bid due diligence</h1>
      <p className="muted">Every bid a member places comes here first. Clearing it sends it to the listing owner and copies both parties; rejecting it stops it and tells the bidder.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">
      {counts.map(q => <a key={q.key} className={q.key === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/bids?status=${q.key}`}>{q.label}<span>{q.count}</span></a>)}
    </nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Search<input name="q" defaultValue={q} placeholder="Listing title or bidder" /></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="oldest">Oldest first</option><option value="newest">Newest first</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {bids.length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>{q ? 'No matches' : 'Queue is clear'}</h2><p>No bids with status “{humanize(status)}”.</p></section>
      : <div className="review-list">{bids.map(bid => {
          const opp = oppById.get(bid.opportunity_id)
          const applicant = applicantById.get(bid.applicant_id)
          const owner = opp ? ownerById.get(opp.owner_user_id) : undefined
          return <article className="card review-card" key={bid.id}>
            <div className="review-head">
              <div>
                <h2>{opp?.title ?? 'Listing'}</h2>
                <p>{opp ? `${opp.sector} · ${opp.country} · ${money(opp.capital_required, opp.currency)} · owner ${owner?.full_name ?? '—'}` : ''}</p>
              </div>
              <span>{dateTime(bid.created_at)}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>Bidder</dt><dd>{applicant?.full_name ?? 'Member'}</dd></div>
              <div><dt>Participant type</dt><dd>{labelForParticipantType(applicant?.participant_type)}</dd></div>
              <div><dt>Bidder verification</dt><dd>{humanize(applicant?.verification_status)}</dd></div>
              <div><dt>Country</dt><dd>{applicant?.country ?? '—'}</dd></div>
            </dl>
            <p className="prose">{bid.message}</p>
            {bid.owner_note && <p className="field-help">Note: {bid.owner_note}</p>}
            {status === 'submitted' && <form action={reviewBid} className="review-form">
              <input type="hidden" name="bidId" value={bid.id} />
              <label>Due diligence note</label>
              <textarea name="reviewNote" rows={2} placeholder="Recorded in the audit log. Shown to the bidder if rejected." />
              <div className="button-row">
                <button className="button button-primary" name="decision" value="clear">Clear to owner</button>
                <button className="button button-danger" name="decision" value="reject">Reject</button>
              </div>
            </form>}
          </article>
        })}</div>}
  </div>
}
