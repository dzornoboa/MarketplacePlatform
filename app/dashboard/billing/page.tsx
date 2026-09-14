import Link from 'next/link'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { SubmitButton } from '@/components/submit-button'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { money, date } from '@/lib/format'
import { requestSubscription, requestMembership, startPayment, cancelPlanChange } from './actions'
import { subscriptionDaysLeft } from '@/lib/auth/access'
import { paystackConfigured } from '@/lib/payments/paystack'
import { getSiteChrome } from '@/lib/content/site-content'
import { PaymentDetails } from '@/components/payment-details'
import { methodTitle } from '@/lib/payments/method-title'
import { kycChecklist, requirementNote } from '@/lib/kyc'
import { KycChecklist } from '@/components/kyc-checklist'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function BillingPage({ searchParams }: Props) {
  const { supabase, profile, claims } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const payRef = typeof params.pay === 'string' ? params.pay : null
  const section = typeof params.section === 'string' ? params.section : null
  const sectionNotice = section === 'payment-details' && (error || message) ? { tone: error ? 'error' as const : 'success' as const, text: (error ?? message)! } : null

  const [{ data: plans }, { data: subscriptions }, { data: memberships }, { data: membershipTypes }, state] = await Promise.all([
    supabase.from('subscription_plans').select('*').eq('active', true).order('price_usd'),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
    supabase.from('memberships').select('*').order('created_at', { ascending: false }),
    supabase.from('membership_types').select('*').eq('active', true),
    readAccessState(supabase),
  ])
  const [{ data: payments }, chrome, { data: billingAddress }, { data: methods }] = await Promise.all([
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(10),
    getSiteChrome(),
    supabase.from('billing_addresses').select('*').eq('user_id', profile.id).maybeSingle(),
    supabase.from('payment_methods').select('*').eq('user_id', profile.id).order('is_primary', { ascending: false }).order('created_at'),
  ])
  const primaryMethod = (methods ?? []).find(m => m.is_primary) ?? null
  const [{ data: myDocs }, { count: orgCount }] = await Promise.all([
    supabase.from('document_records').select('purpose').eq('owner_user_id', profile.id),
    supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
  ])
  const kyc = kycChecklist({ type: profile.participant_type ?? profile.requested_participant_type, purposes: (myDocs ?? []).map(d => d.purpose), hasBillingAddress: !!billingAddress, hasOrganisation: (orgCount ?? 0) > 0, verified: profile.verification_status === 'verified' })
  const active = (subscriptions ?? []).find(s => s.status === 'active')
  const pending = (subscriptions ?? []).find(s => s.status === 'pending')
  const awaiting = (subscriptions ?? []).find(s => s.status === 'awaiting_approval')
  const expired = !active && (subscriptions ?? []).find(s => s.status === 'expired')
  const daysLeft = state ? subscriptionDaysLeft(state) : null
  const email = String(claims.email ?? '')
  const emailDomain = email.split('@')[1]?.toLowerCase() ?? ''
  const { data: orgRows } = await supabase.from('organization_members').select('organization_id').eq('user_id', profile.id)
  const { data: verifiedOrgs } = (orgRows ?? []).length ? await supabase.from('organizations').select('id').in('id', (orgRows ?? []).map(r => r.organization_id)).eq('is_verified', true) : { data: [] }
  const orgVerified = (verifiedOrgs ?? []).length > 0
  const testMode = (st => (st.payment_mode ?? 'test') !== 'live')(chrome.settings as Record<string, string | undefined>)
  const online = testMode || paystackConfigured()
  const pendingPlan = pending ? (plans ?? []).find(p => p.code === pending.plan_code) : null
  const openPayment = (payments ?? []).find(p => p.status === 'pending' && (payRef ? p.reference === payRef : true))
  const st = chrome.settings as Record<string, string | undefined>
  type Plan = NonNullable<typeof plans>[number]
  const myType = profile.participant_type ?? profile.requested_participant_type
  const forType = (p: Plan) => p.target_participant_types.length === 0 ||
    (myType ? p.target_participant_types.includes(myType) : false)
  const activePlan = active ? (plans ?? []).find(p => p.code === active.plan_code) : null
  /* Why a plan is not available to this member right now — mirrors plan_eligibility() in the database. */
  const blocker = (p: Plan): string | null => {
    if (!forType(p) && profile.system_role === 'user') return `For ${p.target_participant_types.map(t => labelForParticipantType(t)).join(', ')} participants`
    if (p.allowed_email_domains.length > 0 && !p.allowed_email_domains.includes(emailDomain)) return `Requires an @${p.allowed_email_domains.join(' or @')} email address`
    if (p.requires_verified_organisation && !orgVerified) return 'Requires a verified organisation on your account'
    return null
  }
  const matched = (plans ?? []).filter(forType)
  const others = (plans ?? []).filter(p => !forType(p))
  const changeInProgress = !!pending || !!awaiting
  const changeLabel = (p: Plan) => {
    if (!activePlan) return expired ? 'Renew on this plan' : 'Choose this plan'
    return p.tier > activePlan.tier ? 'Upgrade to this plan' : p.tier < activePlan.tier ? 'Downgrade to this plan' : 'Switch to this plan'
  }
  /* The plan description is one sentence of comma-separated inclusions;
     split it into the short feature list a pricing card shows. */
  const features = (p: Plan): string[] => (p.description ?? '')
    .replace(/\.$/, '').split(/,\s*|\s+and\s+/).map(f => f.trim()).filter(Boolean)
    .map(f => f.charAt(0).toUpperCase() + f.slice(1))
  /* With no current plan, recommend the best plan the member can take today. */
  const recommended = activePlan ? null : [...matched].filter(p => !blocker(p)).sort((a, b) => b.tier - a.tier)[0] ?? null
  const planAction = (plan: Plan, current: boolean, why: string | null) => current
    ? <span className="status-dot status-verified">Current plan{active?.ends_at ? ` · to ${date(active.ends_at)}` : ''}</span>
    : why
      ? <span className="status-dot">{why}</span>
      : changeInProgress
        ? <span className="status-dot">Change in progress</span>
        : <form action={requestSubscription}>
            <input type="hidden" name="planCode" value={plan.code} />
            <SubmitButton pendingLabel="Requesting…" className={activePlan && plan.tier < activePlan.tier ? 'button button-outline' : 'button button-primary'}>{changeLabel(plan)}</SubmitButton>
          </form>
  const priceOf = (plan: Plan) => Number(plan.price_usd) === 0 ? 'Free' : money(plan.price_usd)
  /* Pricing-card tier for the plans matched to the member's participant type. */
  const pricingCard = (plan: Plan) => {
    const current = active?.plan_code === plan.code
    const why = blocker(plan)
    const highlight = current || recommended?.code === plan.code
    return <article className={`pricing-card${highlight ? ' pricing-highlight' : ''}${why ? ' plan-locked' : ''}`} key={plan.code}>
      {current ? <span className="pricing-badge">Current plan</span> : recommended?.code === plan.code ? <span className="pricing-badge">Recommended</span> : null}
      <h3>{plan.name}</h3>
      <strong className="plan-price">{priceOf(plan)}<small>/{plan.billing_interval}</small></strong>
      <ul className="pricing-features">{features(plan).map(f => <li key={f}>{f}</li>)}</ul>
      {(plan.requires_approval || plan.eligibility_note) && <p className="field-help">{[plan.requires_approval ? 'WTC Accra approval required' : null, plan.eligibility_note].filter(Boolean).join(' · ')}</p>}
      <div className="pricing-action">{planAction(plan, current, why)}</div>
    </article>
  }
  /* Everything else stays out of the way: one compact row per plan, grouped by audience. */
  const AUDIENCES: { label: string; types: string[] }[] = [
    { label: 'WTC members', types: ['wtc_accra_member', 'wtc_association_member'] },
    { label: 'Institutions, government and DFIs', types: ['institutional_partner'] },
    { label: 'Investors', types: ['investor'] },
    { label: 'Businesses and buyers', types: ['business', 'buyer'] },
    { label: 'Project sponsors', types: ['project_sponsor'] },
  ]
  const grouped = AUDIENCES.map(a => ({ ...a, plans: others.filter(p => p.target_participant_types.some(t => a.types.includes(t))) }))
    .filter(a => a.plans.length > 0)
  const seen = new Set<string>()
  const planRow = (plan: Plan) => {
    const current = active?.plan_code === plan.code
    const why = blocker(plan)
    return <div className={`pricing-row${why ? ' plan-locked' : ''}`} key={plan.code}>
      <div>
        <strong>{plan.name}</strong><span className="pricing-row-price">{priceOf(plan)}<small>/{plan.billing_interval}</small></span>
        <p className="muted">{plan.description ?? 'WTC Accra marketplace subscription.'}{plan.requires_approval ? ' WTC Accra approval required.' : ''}</p>
      </div>
      <div className="pricing-action">{planAction(plan, current, why)}</div>
    </div>
  }

  return <div className="page-stack">
    <RealtimeRefresh tables={["payments","subscriptions"]} />
    <div>
      <p className="eyebrow">Billing and membership</p>
      <h1>Subscription and membership</h1>
      <p className="muted">Marketplace browsing requires an active subscription. Membership is a separate WTC Accra relationship.</p>
    </div>
    {error && !sectionNotice && <div className="alert alert-error">{error}</div>}
    {message && !sectionNotice && <div className="alert alert-success">{message}</div>}
    {expired && <div className="alert alert-error">Your {expired.plan_code.replaceAll('_', ' ')} subscription expired on {date(expired.ends_at)}. Marketplace access is paused until you renew below.</div>}
    {active && daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 && <div className="alert alert-error">Your subscription ends in {daysLeft} day{daysLeft === 1 ? '' : 's'} ({date(active.ends_at)}). Renew or change plan below to keep marketplace access.</div>}
    {awaiting && <div className="alert alert-success">Your {awaiting.plan_code.replaceAll('_', ' ')} plan is paid and awaiting WTC Accra approval. You will be notified as soon as it is confirmed.</div>}
    {pending && <form action={cancelPlanChange} className="field-help">Changed your mind? <button className="link-button" type="submit">Cancel this plan change</button></form>}

    {pending && pendingPlan && Number(pendingPlan.price_usd) > 0 && !kyc.ready && <div id="pay">
      <KycChecklist steps={kyc.steps} title={`Before you pay for ${pendingPlan.name}`} intro={`WTC Accra needs your billing address and documents on file before a payment is taken. ${requirementNote(profile.participant_type ?? profile.requested_participant_type, (orgCount ?? 0) > 0)}`} />
    </div>}
    {pending && pendingPlan && Number(pendingPlan.price_usd) > 0 && kyc.ready && <section className="card pay-card" id="pay">
      <h2>Pay for your {pendingPlan.name} plan</h2>
      <p className="muted">Amount due: <strong className="plan-price">{money(pendingPlan.price_usd)}</strong> for one year. Marketplace access opens the moment payment is confirmed.</p>

      {openPayment && openPayment.provider !== 'manual' && <p className="alert alert-success">A {humanize(openPayment.method)} checkout is open for reference <strong>{openPayment.reference}</strong>. <Link className="arrow-link" href={`/dashboard/billing/checkout?ref=${encodeURIComponent(openPayment.reference)}`}>Continue to checkout →</Link></p>}
      {openPayment && openPayment.provider === 'manual'
        ? <div className="pay-instructions">
            <p className="eyebrow">Your payment reference</p>
            <p className="pay-reference">{openPayment.reference}</p>
            <p className="muted">Quote this reference when you pay. WTC Accra finance matches it to your account.</p>
            <div className="split-grid">
              <div>
                <h3>Bank transfer</h3>
                <dl className="detail-grid detail-grid-two">
                  <div><dt>Bank</dt><dd>{st.payment_bank_name || 'Ask WTC Accra finance'}</dd></div>
                  <div><dt>Account name</dt><dd>{st.payment_bank_account_name || '—'}</dd></div>
                  <div><dt>Account number</dt><dd>{st.payment_bank_account_number || '—'}</dd></div>
                  <div><dt>Branch</dt><dd>{st.payment_bank_branch || '—'}</dd></div>
                </dl>
              </div>
              <div>
                <h3>Mobile money</h3>
                <dl className="detail-grid detail-grid-two">
                  <div><dt>Number</dt><dd>{st.payment_momo_number || 'Ask WTC Accra finance'}</dd></div>
                  <div><dt>Account name</dt><dd>{st.payment_momo_name || '—'}</dd></div>
                </dl>
              </div>
            </div>
            {st.payment_instructions && <p className="field-help">{st.payment_instructions}</p>}
            <p className="field-help">Amount: <strong>{money(openPayment.amount, openPayment.currency)}</strong> · Method chosen: {humanize(openPayment.method)} · Started {date(openPayment.created_at)}</p>
          </div>
        : <form action={startPayment} className="form-stack">
            <p className="muted">{online ? `Pay by card or mobile money and your plan activates automatically${testMode ? ' (test mode — no money moves)' : ''}. Or pay by bank transfer and finance confirms it.` : 'Choose how you will pay. You will get a reference and the account details; WTC Accra finance confirms the payment and your plan activates.'}</p>
            <div className="pay-methods">
              <label className="pay-method"><input type="radio" name="method" value="mobile_money" defaultChecked={(primaryMethod?.kind ?? 'mobile_money') === 'mobile_money'} /> <span><strong>Mobile money</strong><small>MTN · Telecel · AirtelTigo{online ? ' — instant' : ''}</small></span></label>
              <label className="pay-method"><input type="radio" name="method" value="card" defaultChecked={primaryMethod?.kind === 'card'} /> <span><strong>Card</strong><small>Visa · Mastercard{online ? ' — instant' : ''}</small></span></label>
              <label className="pay-method"><input type="radio" name="method" value="bank_transfer" defaultChecked={primaryMethod?.kind === 'bank_transfer'} /> <span><strong>Bank transfer</strong><small>Confirmed by WTC Accra finance</small></span></label>
            </div>
            {primaryMethod && <p className="field-help">Primary method on file: <strong>{methodTitle(primaryMethod)}</strong>. <a className="arrow-link" href="#payment-details">Change →</a></p>}
            {!billingAddress && <p className="field-help">Tip: add your <a className="arrow-link" href="#payment-details">billing address</a> so it appears on the receipt.</p>}
            <SubmitButton pendingLabel="Starting…">{online ? 'Continue to payment' : 'Get payment details'}</SubmitButton>
          </form>}
    </section>}

    <section className="dashboard-grid">
      <article className="metric-card">
        <span>Subscription</span>
        <strong>{active ? (activePlan?.name ?? 'Active') : awaiting ? 'Awaiting approval' : pending ? 'Payment due' : expired ? 'Expired' : 'None'}</strong>
        <p>{active ? `Active until ${date(active.ends_at)}.` : awaiting ? 'Paid; WTC Accra is confirming eligibility.' : pending ? 'Complete the payment above.' : expired ? 'Renew to restore access.' : 'An active subscription unlocks published opportunities.'}</p>
      </article>
      <article className="metric-card">
        <span>Marketplace access</span>
        <strong>{state?.has_active_subscription && state.can_view_opportunities ? 'Open' : 'Locked'}</strong>
        <p>{state?.can_view_opportunities === false ? 'Browsing is paused by WTC Accra on this account.' : state?.has_active_subscription ? 'You can browse every published opportunity.' : 'Subscribe to browse opportunities.'}</p>
      </article>
      <article className="metric-card">
        <span>Participant type</span>
        <strong>{labelForParticipantType(myType)}</strong>
        <p>{profile.participant_type ? 'Plans are matched to your approved participant type.' : 'Requested type — plans are matched to it while WTC Accra reviews your verification.'}</p>
      </article>
    </section>

    <section className="pricing-section">
      <div className="pricing-head">
        <h2>{matched.length > 0 ? `Plans for ${labelForParticipantType(myType)} participants` : 'Plans'}</h2>
        <p className="muted">Billed annually. Pay by card, mobile money or bank transfer; the marketplace opens as soon as the payment is confirmed.</p>
      </div>
      {matched.length > 0 && <div className="pricing-cards" data-count={matched.length}>{matched.map(pricingCard)}</div>}
      {others.length > 0 && <details className="plan-others">
        <summary>{matched.length > 0 ? `Plans for other participant types (${others.length})` : `All plans (${others.length})`}</summary>
        {grouped.map(g => {
          const rows = g.plans.filter(p => !seen.has(p.code))
          rows.forEach(p => seen.add(p.code))
          return rows.length ? <div className="pricing-group" key={g.label}><h3 className="plan-group-title">{g.label}</h3>{rows.map(planRow)}</div> : null
        })}
      </details>}
    </section>

    {(payments ?? []).length > 0 && <section className="card">
      <h2>Payments</h2>
      <div className="history-list">{(payments ?? []).map(p => <div key={p.id}>
        <strong>{p.reference}</strong><span>{date(p.created_at)}</span>
        <p className="muted">{money(p.amount, p.currency)} · {humanize(p.method)} · <span className={`status-dot status-pay-${p.status}`}>{humanize(p.status)}</span>{p.paid_at ? ` · paid ${date(p.paid_at)}` : ''}</p>
      </div>)}</div>
    </section>}

    <PaymentDetails address={billingAddress ?? null} methods={methods ?? []} notice={sectionNotice} />

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
