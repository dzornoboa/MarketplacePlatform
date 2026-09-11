import { requireCapability } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { money, date, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { reviewOpportunity } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const QUEUES = ['submitted', 'in_review', 'published', 'changes_requested', 'rejected', 'draft'] as const

export default async function AdminOpportunitiesPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('opportunities')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' && QUEUES.includes(params.status as 'submitted') ? params.status : 'submitted'

  const { data: opportunities } = await supabase.from('opportunities').select('*')
    .eq('status', status as 'submitted').order('submitted_at', { ascending: true }).limit(100)

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

    {(opportunities ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Queue is clear</h2><p>No opportunities with status “{humanize(status)}”.</p></section>
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
              <div><dt>Type</dt><dd>{humanize(item.kind)}</dd></div>
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
          </article>
        })}</div>}
  </div>
}
