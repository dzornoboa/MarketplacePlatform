import { requireCapability } from '@/lib/auth/guards'
import { humanize, labelForIntent } from '@/lib/auth/access'
import { money, date, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { reviewOpportunity, setDealGrading, openDealRoom } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const QUEUES = ['submitted', 'in_review', 'published', 'changes_requested', 'rejected', 'draft'] as const

export default async function AdminOpportunitiesPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('opportunities')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' && QUEUES.includes(params.status as 'submitted') ? params.status : 'submitted'
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const intent = typeof params.intent === 'string' ? params.intent : ''
  const sort = typeof params.sort === 'string' && ['newest', 'oldest', 'title', 'amount'].includes(params.sort) ? params.sort : 'oldest'

  let query = supabase.from('opportunities').select('*').eq('status', status as 'submitted').limit(200)
  if (q) query = query.or(`title.ilike.%${q}%,sector.ilike.%${q}%,country.ilike.%${q}%`)
  if (intent) query = query.eq('intent', intent as 'seeking_investment')
  query = sort === 'title' ? query.order('title')
    : sort === 'amount' ? query.order('capital_required', { ascending: false, nullsFirst: false })
    : query.order('created_at', { ascending: sort === 'oldest' })
  const { data: opportunities } = await query

  const ownerIds = [...new Set((opportunities ?? []).map(o => o.owner_user_id))]
  const { data: owners } = ownerIds.length
    ? await supabase.from('profiles').select('id,full_name,participant_type,country').in('id', ownerIds)
    : { data: [] }
  const ownerById = new Map((owners ?? []).map(o => [o.id, o]))

  const counts = await Promise.all(QUEUES.map(async q => {
    const { count } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', q)
    return { status: q, count: count ?? 0 }
  }))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Trade desk</p>
      <h1>Opportunity review</h1>
      <p className="muted">Nothing reaches the marketplace without review. Publishing makes a listing visible to verified, subscribed members only.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">
      {counts.map(q => <a key={q.status} className={q.status === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/opportunities?status=${q.status}`}>
        {humanize(q.status)}<span>{q.count}</span>
      </a>)}
    </nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Search<input name="q" defaultValue={q} placeholder="Title, sector or country" /></label>
      <label>Intent
        <select name="intent" defaultValue={intent}>
          <option value="">All</option>
          {['seeking_investment', 'offering_investment', 'offering_supply', 'seeking_supply', 'partnership'].map(i => <option key={i} value={i}>{labelForIntent(i)}</option>)}
        </select>
      </label>
      <label>Sort
        <select name="sort" defaultValue={sort}>
          <option value="oldest">Oldest first</option><option value="newest">Newest first</option><option value="title">Title A–Z</option><option value="amount">Largest capital</option>
        </select>
      </label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {(opportunities ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>{q || intent ? 'No matches' : 'Queue is clear'}</h2><p>No opportunities with status “{humanize(status)}”.</p></section>
      : <div className="review-list">{(opportunities ?? []).map(item => {
          const owner = ownerById.get(item.owner_user_id)
          return <article className="card review-card" key={item.id}>
            <div className="review-head">
              <div>
                <h2>{item.title}</h2>
                <p>{owner?.full_name ?? 'Unknown owner'} · {humanize(owner?.participant_type)} · {item.sector} · {item.city ? `${item.city}, ` : ''}{item.country}</p>
              </div>
              <span>{item.submitted_at ? dateTime(item.submitted_at) : dateTime(item.created_at)}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>Type</dt><dd>{labelForIntent(item.intent)} · {humanize(item.kind)}</dd></div>
              <div><dt>Capital required</dt><dd>{money(item.capital_required, item.currency)}</dd></div>
              <div><dt>Minimum ticket</dt><dd>{money(item.minimum_ticket, item.currency)}</dd></div>
              <div><dt>Deadline</dt><dd>{date(item.deadline)}</dd></div>
            </dl>
            <p className="muted">{item.summary}</p>
            <details className="eoi-block"><summary>Full description</summary><p className="prose">{item.description}</p></details>
            {item.review_note && <p className="field-help">Previous note: {item.review_note}</p>}
            <form action={reviewOpportunity} className="review-form">
              <input type="hidden" name="opportunityId" value={item.id} />
              <label>Reviewer note</label>
              <textarea name="reviewerNote" rows={2} placeholder="Shown to the owner for changes and rejections." />
              <div className="button-row">
                <button className="button button-primary" name="decision" value="publish">Publish</button>
                <button className="button button-secondary" name="decision" value="changes">Request changes</button>
                <button className="button button-danger" name="decision" value="reject">Reject</button>
              </div>
            </form>

            <div className="admin-action-grid">
              <form action={setDealGrading} className="review-form">
                <label>Deal rating and region</label>
                <input type="hidden" name="opportunityId" value={item.id} />
                <select name="importance" defaultValue={String(item.importance)}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} — {n} of 5</option>)}
                </select>
                <input name="region" defaultValue={item.region ?? ''} placeholder="Region, e.g. West Africa" />
                <p className="field-help">Members sort the feed by this rating. Owners cannot set it.</p>
                <button className="button button-secondary" type="submit">Save rating</button>
              </form>

              {item.status === 'published' && <form action={openDealRoom} className="review-form">
                <label>Deal room</label>
                <input type="hidden" name="opportunityId" value={item.id} />
                <p className="field-help">Opens a private room for this transaction and adds the owner. Add the counterparty afterwards.</p>
                <button className="button button-outline" type="submit">Open deal room</button>
              </form>}
            </div>
          </article>
        })}</div>}
  </div>
}
