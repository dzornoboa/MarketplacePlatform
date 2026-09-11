import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { money, date } from '@/lib/format'
import { requestSubscription, requestMembership } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function BillingPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const [{ data: plans }, { data: subscriptions }, { data: memberships }, { data: membershipTypes }, state] = await Promise.all([
    supabase.from('subscription_plans').select('*').eq('active', true).order('price_usd'),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('memberships').select('*').order('created_at', { ascending: false }),
    supabase.from('membership_types').select('*').eq('active', true),
    readAccessState(supabase),
  ])

  const active = (subscriptions ?? []).find(s => s.status === 'active')
  const pending = (subscriptions ?? []).find(s => s.status === 'pending')
  const eligible = (plans ?? []).filter(p =>
    p.target_participant_types.length === 0 ||
    (profile.participant_type ? p.target_participant_types.includes(profile.participant_type) : false))
  const offered = eligible.length > 0 ? eligible : (plans ?? [])

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Billing and membership</p>
      <h1>Subscription and membership</h1>
      <p className="muted">Marketplace browsing requires an active subscription. Membership is a separate WTC Accra relationship.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="dashboard-grid">
      <article className="metric-card">
        <span>Subscription</span>
        <strong>{active ? 'Active' : pending ? 'Pending' : 'None'}</strong>
        <p>{active ? `Renews or expires ${date(active.ends_at)}.` : pending ? 'Awaiting confirmation from WTC Accra finance.' : 'An active subscription unlocks published opportunities.'}</p>
      </article>
      <article className="metric-card">
        <span>Marketplace access</span>
        <strong>{state?.has_active_subscription && state.can_view_opportunities ? 'Open' : 'Locked'}</strong>
        <p>{state?.can_view_opportunities === false ? 'Browsing is paused by WTC Accra on this account.' : state?.has_active_subscription ? 'You can browse every published opportunity.' : 'Subscribe to browse opportunities.'}</p>
      </article>
      <article className="metric-card">
        <span>Participant type</span>
        <strong>{labelForParticipantType(profile.participant_type)}</strong>
        <p>Plans are matched to your approved participant type.</p>
      </article>
    </section>

    <section>
      <h2>Plans</h2>
      <p className="muted">Prices are annual and billed by WTC Accra directly. Requesting a plan does not take payment.</p>
      <div className="plan-grid">
        {offered.map(plan => {
          const current = active?.plan_code === plan.code
          return <article className={`card plan-card${current ? ' plan-current' : ''}`} key={plan.code}>
            <span className="eyebrow">{plan.name}</span>
            <strong className="plan-price">{money(plan.price_usd)}<small>/{plan.billing_interval}</small></strong>
            <p className="muted">{plan.description ?? 'WTC Accra marketplace subscription.'}</p>
            <p className="field-help">For: {plan.target_participant_types.map(t => labelForParticipantType(t)).join(', ') || 'All participants'}</p>
            {current
              ? <span className="status-dot status-verified">Current plan</span>
              : <form action={requestSubscription}>
                  <input type="hidden" name="planCode" value={plan.code} />
                  <button className="button button-primary" type="submit" disabled={!!pending}>{pending ? 'Request pending' : 'Request this plan'}</button>
                </form>}
          </article>
        })}
      </div>
    </section>

    <section className="card">
      <h2>Subscription history</h2>
      {(subscriptions ?? []).length === 0
        ? <p className="muted">No subscription requests yet.</p>
        : <div className="history-list">{(subscriptions ?? []).map(s =>
            <div key={s.id}>
              <strong>{s.plan_code.replaceAll('_', ' ')}</strong>
              <span>{date(s.created_at)}</span>
              <p className="muted">{humanize(s.status)} · {s.starts_at ? `from ${date(s.starts_at)}` : 'not started'} {s.ends_at ? `until ${date(s.ends_at)}` : ''}</p>
            </div>)}</div>}
    </section>

    <section className="card">
      <h2>WTC Accra membership</h2>
      <p className="muted">Membership is distinct from a marketplace subscription. It records your formal relationship with WTC Accra or the wider WTCA network.</p>
      {(memberships ?? []).length > 0 && <div className="history-list">{(memberships ?? []).map(m =>
        <div key={m.id}>
          <strong>{m.membership_type_code.replaceAll('_', ' ')}</strong>
          <span>{date(m.created_at)}</span>
          <p className="muted">{humanize(m.status)}{m.member_number ? ` · ${m.member_number}` : ''}{m.valid_until ? ` · valid to ${date(m.valid_until)}` : ''}</p>
        </div>)}</div>}
      {(memberships ?? []).length === 0 && <form action={requestMembership} className="form-stack">
        <label>Membership type
          <select name="membershipTypeCode" defaultValue="" required>
            <option value="" disabled>Select a membership type</option>
            {(membershipTypes ?? []).map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
        </label>
        <button className="button button-secondary" type="submit">Request membership</button>
      </form>}
    </section>
  </div>
}
