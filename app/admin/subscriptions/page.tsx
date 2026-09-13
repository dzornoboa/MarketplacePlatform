import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { money, date, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { SubmitButton } from '@/components/submit-button'
import { reviewSubscription, decideSubscription } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const TABS = ['awaiting_approval', 'pending', 'active', 'past_due', 'expired', 'cancelled'] as const
const SORTS = ['newest', 'oldest', 'ends', 'member', 'value'] as const

export default async function AdminSubscriptionsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('finance')
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const error = str('error') || null, message = str('message') || null
  const status = TABS.includes(str('status') as 'pending') ? str('status') : 'awaiting_approval'
  const q = str('q').trim()
  const planFilter = str('plan')
  const sort = SORTS.includes(str('sort') as 'newest') ? str('sort') : 'newest'

  let query = supabase.from('subscriptions').select('*').eq('status', status as 'pending').limit(300)
  if (planFilter) query = query.eq('plan_code', planFilter)
  query = sort === 'ends' ? query.order('ends_at', { ascending: true, nullsFirst: false }) : query.order('created_at', { ascending: sort === 'oldest' })
  const [{ data: rows }, { data: plans }, counts] = await Promise.all([
    query,
    supabase.from('subscription_plans').select('*').order('tier'),
    Promise.all(TABS.map(async t => ({ t, n: (await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', t)).count ?? 0 }))),
  ])
  const planByCode = new Map((plans ?? []).map(p => [p.code, p]))
  const userIds = [...new Set((rows ?? []).map(s => s.user_id))]
  const { data: members } = userIds.length ? await supabase.from('profiles').select('id,full_name,participant_type,country,verification_status').in('id', userIds) : { data: [] }
  const memberById = new Map((members ?? []).map(m => [m.id, m]))
  const replacedIds = [...new Set((rows ?? []).map(s => s.replaces_subscription_id).filter((x): x is string => !!x))]
  const { data: replaced } = replacedIds.length ? await supabase.from('subscriptions').select('id,plan_code').in('id', replacedIds) : { data: [] }
  const replacedById = new Map((replaced ?? []).map(r => [r.id, r]))

  let subscriptions = (rows ?? []).filter(s => !q || (memberById.get(s.user_id)?.full_name ?? '').toLowerCase().includes(q.toLowerCase()))
  if (sort === 'member') subscriptions = [...subscriptions].sort((a, b) => (memberById.get(a.user_id)?.full_name ?? '').localeCompare(memberById.get(b.user_id)?.full_name ?? ''))
  if (sort === 'value') subscriptions = [...subscriptions].sort((a, b) => Number(planByCode.get(b.plan_code)?.price_usd ?? 0) - Number(planByCode.get(a.plan_code)?.price_usd ?? 0))
  const revenue = subscriptions.reduce((sum, s) => sum + Number(planByCode.get(s.plan_code)?.price_usd ?? 0), 0)

  return <div className="page-stack">
    <RealtimeRefresh tables={["subscriptions","payments","memberships"]} />
    <div>
      <p className="eyebrow">Finance</p>
      <h1>Subscriptions</h1>
      <p className="muted">Paid plans activate themselves; restricted plans (WTC members, institutions, government) wait here for eligibility approval after payment. Click a member to see their full record.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">
      {counts.map(c => <a key={c.t} className={c.t === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/subscriptions?status=${c.t}`}>{humanize(c.t)}<span>{c.n}</span></a>)}
    </nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Member<input name="q" defaultValue={q} placeholder="Member name" /></label>
      <label>Plan<select name="plan" defaultValue={planFilter}><option value="">All plans</option>{(plans ?? []).map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="ends">Ending soonest</option><option value="member">Member A–Z</option><option value="value">Highest value</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    <section className="dashboard-grid">
      <article className="metric-card"><span>In this queue</span><strong>{subscriptions.length}</strong><p>Records with status “{humanize(status)}”.</p></article>
      <article className="metric-card"><span>Annual value</span><strong>{money(revenue)}</strong><p>List value of the records shown.</p></article>
      <article className="metric-card"><span>Plans offered</span><strong>{(plans ?? []).filter(p => p.active).length}</strong><p>Active subscription plans.</p></article>
    </section>

    {subscriptions.length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Nothing in this queue</h2><p>No subscriptions with status “{humanize(status)}”{q || planFilter ? ' matching the filters' : ''}.</p></section>
      : <div className="review-list">{subscriptions.map(item => {
          const member = memberById.get(item.user_id)
          const plan = planByCode.get(item.plan_code)
          const prev = item.replaces_subscription_id ? replacedById.get(item.replaces_subscription_id) : null
          const prevPlan = prev ? planByCode.get(prev.plan_code) : null
          return <article className="card review-card" key={item.id}>
            <div className="review-head">
              <div>
                <h2><Link href={`/admin/users/${item.user_id}`}>{member?.full_name ?? 'Unknown member'}</Link></h2>
                <p>{plan?.name ?? item.plan_code} · {Number(plan?.price_usd ?? 0) === 0 ? 'Free' : money(plan?.price_usd ?? null)} / {plan?.billing_interval ?? 'year'} · {labelForParticipantType(member?.participant_type)} · {member?.country ?? '—'}</p>
              </div>
              <span>{dateTime(item.created_at)}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>Status</dt><dd>{humanize(item.status)}</dd></div>
              <div><dt>Starts</dt><dd>{date(item.starts_at)}</dd></div>
              <div><dt>Ends</dt><dd>{date(item.ends_at)}</dd></div>
              <div><dt>Reference</dt><dd>{item.external_reference || '—'}</dd></div>
            </dl>
            {prev && <p className="field-help">{plan && prevPlan && plan.tier > prevPlan.tier ? 'Upgrade' : 'Change'} from {prevPlan?.name ?? prev.plan_code}; the old plan is cancelled when this one activates.</p>}
            {plan?.eligibility_note && item.status === 'awaiting_approval' && <p className="field-help">Eligibility: {plan.eligibility_note}</p>}

            {item.status === 'awaiting_approval' && <form action={decideSubscription} className="review-form">
              <input type="hidden" name="subscriptionId" value={item.id} />
              <input name="note" placeholder="Note to the member (optional)" />
              <div className="button-row">
                <SubmitButton name="decision" value="approve" pendingLabel="Approving…">Approve — eligible</SubmitButton>
                <SubmitButton name="decision" value="decline" className="button button-danger" pendingLabel="Declining…">Decline</SubmitButton>
                <Link className="button button-outline" href={`/admin/users/${item.user_id}`}>Check the member</Link>
              </div>
            </form>}
            {(item.status === 'pending' || item.status === 'past_due' || item.status === 'expired') && <form action={reviewSubscription} className="review-form">
              <input type="hidden" name="subscriptionId" value={item.id} />
              <label>Valid until (on activation)</label>
              <input name="validUntil" type="date" />
              <div className="button-row">
                <SubmitButton name="decision" value="activate" pendingLabel="Activating…">Activate manually</SubmitButton>
                {item.status === 'pending' && <SubmitButton name="decision" value="cancel" className="button button-danger" pendingLabel="Cancelling…">Cancel</SubmitButton>}
              </div>
            </form>}
            {item.status === 'active' && <div className="button-row">
              <Link className="button button-outline" href={`/admin/users/${item.user_id}`}>Extend, change or end on the member page</Link>
            </div>}
          </article>
        })}</div>}
  </div>
}
