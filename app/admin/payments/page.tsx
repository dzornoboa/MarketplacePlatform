import { requireCapability } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { money, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { confirmPayment } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const STATUSES = ['pending', 'paid', 'failed', 'cancelled', 'refunded'] as const

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('finance')
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const error = str('error') || null, message = str('message') || null
  const status = STATUSES.includes(str('status') as 'pending') ? str('status') : 'pending'
  const q = str('q').trim()
  const sort = str('sort') === 'oldest' ? 'oldest' : 'newest'

  let query = supabase.from('payments').select('*').eq('status', status as 'pending').order('created_at', { ascending: sort === 'oldest' }).limit(200)
  if (q) query = query.or(`reference.ilike.%${q}%,provider_reference.ilike.%${q}%`)
  const { data: payments } = await query

  const userIds = [...new Set((payments ?? []).map(p => p.user_id))]
  const { data: members } = userIds.length ? await supabase.from('profiles').select('id,full_name,participant_type,country').in('id', userIds) : { data: [] }
  const memberById = new Map((members ?? []).map(m => [m.id, m]))
  const counts = await Promise.all(STATUSES.map(async s => ({ s, n: (await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', s)).count ?? 0 })))
  const total = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Finance</p>
      <h1>Payments</h1>
      <p className="muted">Bank transfers and mobile-money payments arrive here with the member&rsquo;s reference. Confirming one activates their subscription immediately. Card and mobile-money checkouts through the provider confirm themselves.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">{counts.map(c => <a key={c.s} className={c.s === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/payments?status=${c.s}`}>{humanize(c.s)}<span>{c.n}</span></a>)}</nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Reference<input name="q" defaultValue={q} placeholder="WTC-…" /></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    <section className="dashboard-grid">
      <article className="metric-card"><span>In this queue</span><strong>{(payments ?? []).length}</strong><p>Payments with status “{humanize(status)}”.</p></article>
      <article className="metric-card"><span>Value shown</span><strong>{money(total)}</strong><p>Sum of the payments listed.</p></article>
    </section>

    {(payments ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Nothing here</h2><p>No {humanize(status)} payments.</p></section>
      : <div className="review-list">{(payments ?? []).map(p => {
          const member = memberById.get(p.user_id)
          return <article className="card review-card" key={p.id}>
            <div className="review-head">
              <div><h2>{p.reference}</h2><p>{member?.full_name ?? 'Member'} · {humanize(member?.participant_type)} · {member?.country ?? '—'}</p></div>
              <span>{dateTime(p.created_at)}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>Amount</dt><dd><strong>{money(p.amount, p.currency)}</strong></dd></div>
              <div><dt>Plan</dt><dd>{p.plan_code?.replaceAll('_', ' ') ?? '—'}</dd></div>
              <div><dt>Method</dt><dd>{humanize(p.method)} · {p.provider}</dd></div>
              <div><dt>Provider ref</dt><dd>{p.provider_reference ?? '—'}</dd></div>
            </dl>
            {p.note && <p className="field-help">Note: {p.note}</p>}
            {p.status === 'pending' && <form action={confirmPayment} className="review-form">
              <input type="hidden" name="paymentId" value={p.id} />
              <label>Note (bank reference, receipt number)</label>
              <input name="note" placeholder="e.g. GCB transfer ref 4471 received 13 Sep" />
              <div className="button-row">
                <button className="button button-primary" name="decision" value="paid">Confirm received</button>
                <button className="button button-outline" name="decision" value="failed">Not received</button>
                <button className="button button-danger" name="decision" value="cancelled">Cancel</button>
              </div>
            </form>}
          </article>
        })}</div>}
  </div>
}
