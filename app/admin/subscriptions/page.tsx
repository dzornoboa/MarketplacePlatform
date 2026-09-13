import { requireCapability } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { humanize } from '@/lib/auth/access'
import { money, date, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { reviewSubscription } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminSubscriptionsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('finance')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' ? params.status : 'pending'

  const [{ data: subscriptions }, { data: plans }] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('status', status as 'pending').order('created_at', { ascending: true }).limit(100),
    supabase.from('subscription_plans').select('*'),
  ])
  const planByCode = new Map((plans ?? []).map(p => [p.code, p]))

  const userIds = [...new Set((subscriptions ?? []).map(s => s.user_id))]
  const { data: members } = userIds.length
    ? await supabase.from('profiles').select('id,full_name,participant_type,country').in('id', userIds)
    : { data: [] }
  const memberById = new Map((members ?? []).map(m => [m.id, m]))

  const tabs = ['pending', 'active', 'past_due', 'expired', 'cancelled'] as const
  const revenue = (subscriptions ?? []).reduce((sum, s) => sum + Number(planByCode.get(s.plan_code)?.price_usd ?? 0), 0)

  return <div className="page-stack">
    <RealtimeRefresh tables={["subscriptions","payments","memberships"]} />
    <div>
      <p className="eyebrow">Finance</p>
      <h1>Subscriptions</h1>
      <p className="muted">Activating a subscription is what unlocks marketplace browsing. Confirm payment before approving.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">
      {tabs.map(t => <a key={t} className={t === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/subscriptions?status=${t}`}>{humanize(t)}</a>)}
    </nav>

    <section className="dashboard-grid">
      <article className="metric-card"><span>In this queue</span><strong>{(subscriptions ?? []).length}</strong><p>Subscription records with status “{humanize(status)}”.</p></article>
      <article className="metric-card"><span>Annual value</span><strong>{money(revenue)}</strong><p>List value of the records shown.</p></article>
      <article className="metric-card"><span>Plans offered</span><strong>{(plans ?? []).filter(p => p.active).length}</strong><p>Active subscription plans.</p></article>
    </section>

    {(subscriptions ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Nothing in this queue</h2><p>No subscriptions with status “{humanize(status)}”.</p></section>
      : <div className="review-list">{(subscriptions ?? []).map(item => {
          const member = memberById.get(item.user_id)
          const plan = planByCode.get(item.plan_code)
          return <article className="card review-card" key={item.id}>
            <div className="review-head">
              <div>
                <h2>{member?.full_name ?? 'Unknown member'}</h2>
                <p>{plan?.name ?? item.plan_code} · {money(plan?.price_usd ?? null)} / {plan?.billing_interval ?? 'year'} · {humanize(member?.participant_type)}</p>
              </div>
              <span>{dateTime(item.created_at)}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>Status</dt><dd>{humanize(item.status)}</dd></div>
              <div><dt>Starts</dt><dd>{date(item.starts_at)}</dd></div>
              <div><dt>Ends</dt><dd>{date(item.ends_at)}</dd></div>
              <div><dt>Reference</dt><dd>{item.external_reference || '—'}</dd></div>
            </dl>
            <form action={reviewSubscription} className="review-form">
              <input type="hidden" name="subscriptionId" value={item.id} />
              <label>Valid until (on activation)</label>
              <input name="validUntil" type="date" />
              <div className="button-row">
                <button className="button button-primary" name="decision" value="activate">Activate</button>
                <button className="button button-danger" name="decision" value="cancel">Cancel</button>
              </div>
            </form>
          </article>
        })}</div>}
  </div>
}
