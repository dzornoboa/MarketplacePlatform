import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { money } from '@/lib/format'
import { BarChart } from '@/components/charts'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLock, postingLock, labelForParticipantType, humanize, isAdminRole, systemRoleLabels } from '@/lib/auth/access'
import { date, dateTime } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { supabase, profile, claims } = await requireUserProfile()
  const displayName = profile.full_name || String(claims.email ?? 'Member')

  const [state, { count: myListings }, { count: openInterest }, { data: notifications }, { data: activeSub }] = await Promise.all([
    readAccessState(supabase),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('owner_user_id', profile.id),
    supabase.from('expressions_of_interest').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('subscriptions').select('plan_code,ends_at').eq('status', 'active').limit(1).maybeSingle(),
  ])
  // Deal-flow KPIs: the member's listings, bids placed and received, matches and connections.
  const [{ data: myOpps }, { data: myBids }, { data: recvBids }, { data: myMatches }, { data: myConns }, { data: mySaved }] = await Promise.all([
    supabase.from('opportunities').select('id,status,capital_required').eq('owner_user_id', profile.id),
    supabase.from('expressions_of_interest').select('status').eq('applicant_id', profile.id),
    supabase.from('expressions_of_interest').select('status,opportunity_id').neq('applicant_id', profile.id),
    supabase.from('matches').select('status').eq('user_id', profile.id),
    supabase.from('connections').select('status'),
    supabase.from('saved_opportunities').select('opportunity_id'),
  ])
  const tally = (rows: Array<{ status: string }> | null) => { const o: Record<string, number> = {}; for (const r of rows ?? []) o[r.status] = (o[r.status] ?? 0) + 1; return o }
  const oppT = tally(myOpps), bidT = tally(myBids), recvT = tally(recvBids), matchT = tally(myMatches), connT = tally(myConns)
  const capitalSought = (myOpps ?? []).filter(o => o.status === 'published').reduce((sum, o) => sum + Number(o.capital_required ?? 0), 0)
  const hasDealActivity = (myOpps ?? []).length + (myBids ?? []).length + (recvBids ?? []).length + (myMatches ?? []).length > 0

  const adminRole = isAdminRole(profile.system_role)
  const adminMfaReady = adminRole && claims.aal === 'aal2'
  const { data: factors } = adminRole && !adminMfaReady ? await supabase.auth.mfa.listFactors() : { data: null }
  const hasFactor = (factors?.totp ?? []).some(f => f.status === 'verified')
  const browse = state ? marketplaceLock(state) : null
  const post = state ? postingLock(state) : null
  const { data: readiness } = await supabase.rpc('payment_readiness')
  const kycReady = (readiness as { ready?: boolean } | null)?.ready === true
  const steps = [
    { done: profile.profile_completed, label: 'Complete your profile', href: '/dashboard/profile' },
    { done: kycReady, label: 'Billing address and required documents on file', href: '/dashboard/billing#kyc' },
    { done: !!state?.has_active_subscription, label: 'Activate a subscription — opens the marketplace', href: '/dashboard/billing' },
    { done: profile.verification_status === 'verified', label: 'Earn the WTC Accra verified check', href: '/dashboard/verification' },
  ]

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Member dashboard</p>
      <h1>Welcome, {displayName}</h1>
      <p className="muted">Your WTC Accra trade and investment workspace.</p>
      <div className="button-row">
        <Link className="button button-primary" href="/opportunities">View live listings</Link>
        <Link className="button button-outline" href="/dashboard/opportunities/new">Post a listing</Link>
      </div>
    </div>

    {adminRole && !adminMfaReady && <section className="admin-setup-card">
      <div className="admin-setup-copy">
        <p className="eyebrow light">{hasFactor ? 'Sign-in verification' : 'One step remaining'}</p>
        <h2>{hasFactor
          ? 'Enter your authenticator code to unlock the ' + systemRoleLabels[profile.system_role].toLowerCase() + ' console'
          : 'Your ' + systemRoleLabels[profile.system_role].toLowerCase() + ' console is locked until you add an authenticator'}</h2>
        {hasFactor
          ? <p>Your authenticator is set up. Each new sign-in needs the current six-digit code from the app before verification, publishing, member access and site editing are enabled for this session.</p>
          : <>
              <p>Every WTC Accra administrator signs in with a password <em>and</em> a six-digit code from an authenticator app. Until that is set up, verification, publishing, member access and site editing are all disabled for this account — by design, because this account can change every other account.</p>
              <ol className="admin-setup-steps">
                <li><span>1</span>Install Google Authenticator, Microsoft Authenticator or 1Password on your phone.</li>
                <li><span>2</span>Open <strong>Set up authenticator</strong> below and scan the code it shows.</li>
                <li><span>3</span>Enter the six-digit code. The console unlocks immediately.</li>
              </ol>
            </>}
        <Link className="button button-light" href="/dashboard/security?required=admin-mfa">{hasFactor ? 'Enter code now' : 'Set up authenticator now'}</Link>
      </div>
    </section>}

    {browse?.locked && <section className="restriction-banner">
      <div><strong>Marketplace access is restricted</strong><p>{browse.reason}</p></div>
      {browse.action && <Link className="button button-light" href={browse.action.href}>{browse.action.label}</Link>}
    </section>}

    <section className="dashboard-grid">
      <article className="metric-card">
        <span>Verified check</span>
        <strong>{profile.verification_status === 'verified' ? <span className="vcheck-row"><VerifiedCheck verified size={18} /> Verified</span> : humanize(profile.verification_status)}</strong>
        <p>{profile.verification_status === 'verified' ? 'Other members see the WTC Accra check beside your name.' : 'Optional: shows other members that WTC Accra has reviewed your documents.'}</p>
        <Link href="/dashboard/verification">Open verification →</Link>
      </article>
      <article className="metric-card">
        <span>Subscription</span>
        <strong>{state?.has_active_subscription ? 'Active' : 'Inactive'}</strong>
        <p>{activeSub ? `${activeSub.plan_code.replaceAll('_', ' ')}${activeSub.ends_at ? ` · to ${date(activeSub.ends_at)}` : ''}` : 'Needed to browse published opportunities.'}</p>
        <Link href="/dashboard/billing">Manage billing →</Link>
      </article>
      <article className="metric-card">
        <span>Your listings</span>
        <strong>{myListings ?? 0}</strong>
        <p>{post?.locked ? post.reason : 'Drafts, submissions and published opportunities.'}</p>
        <Link href="/dashboard/opportunities">Open marketplace →</Link>
      </article>
    </section>

    {hasDealActivity && <section className="card">
      <h2>Your deal flow</h2>
      <div className="dashboard-grid deal-kpis">
        <article className="metric-card"><span>Listings</span><strong>{(myOpps ?? []).length}</strong><p>{oppT.published ?? 0} live · {money(capitalSought)} sought</p></article>
        <article className="metric-card"><span>Bids received</span><strong>{(recvBids ?? []).length}</strong><p>{recvT.under_review ?? 0} to answer · {recvT.accepted ?? 0} accepted</p></article>
        <article className="metric-card"><span>Bids placed</span><strong>{(myBids ?? []).length}</strong><p>{bidT.submitted ?? 0} in due diligence · {bidT.accepted ?? 0} accepted</p></article>
        <article className="metric-card"><span>Matches</span><strong>{(myMatches ?? []).length}</strong><p>{matchT.shortlisted ?? 0} shortlisted · {(mySaved ?? []).length} saved</p></article>
        <article className="metric-card"><span>Connections</span><strong>{connT.accepted ?? 0}</strong><p>{connT.pending ?? 0} pending</p></article>
      </div>
      <div className="insight-grid">
        {(myOpps ?? []).length > 0 && <BarChart title="Your listings by status" data={Object.entries(oppT).map(([k, v]) => ({ label: humanize(k), value: v }))} height={120} />}
        {((myBids ?? []).length + (recvBids ?? []).length) > 0 && <BarChart title="Bids by stage (placed + received)" data={Object.entries(tally([...(myBids ?? []), ...(recvBids ?? [])])).map(([k, v]) => ({ label: humanize(k), value: v }))} height={120} />}
      </div>
    </section>}

    <section className="card">
      <h2>Getting to full access</h2>
      <p className="muted">A subscription opens the marketplace. The verified check is awarded by WTC Accra after reviewing your documents and tells other members you are a verified source.</p>
      <ol className="checklist">
        {steps.map(step => <li key={step.label} className={step.done ? 'checklist-done' : ''}>
          <span aria-hidden="true">{step.done ? '✓' : '○'}</span>
          <Link href={step.href}>{step.label}</Link>
          <em>{step.done ? 'Complete' : 'Outstanding'}</em>
        </li>)}
      </ol>
    </section>

    <section className="split-grid">
      <div className="card">
        <h2>Recent activity</h2>
        {(notifications ?? []).length === 0
          ? <p className="muted">Nothing yet. Verification and deal-flow updates appear here.</p>
          : <div className="history-list">{(notifications ?? []).map(n => <div key={n.id}>
              <strong>{n.title}</strong>
              <span>{dateTime(n.created_at)}</span>
              {n.body && <p className="muted">{n.body}</p>}
            </div>)}</div>}
        <Link className="arrow-link" href="/dashboard/notifications">All notifications →</Link>
      </div>
      <div className="card">
        <h2>Account summary</h2>
        <dl className="detail-grid detail-grid-two">
          <div><dt>Participant type</dt><dd><ParticipantBadge type={profile.participant_type} requested={profile.requested_participant_type} size="md" /></dd></div>
          <div><dt>Requested type</dt><dd>{labelForParticipantType(profile.requested_participant_type)}</dd></div>
          <div><dt>Verified check</dt><dd>{profile.verification_status === 'verified' ? <span className="vcheck-row"><VerifiedCheck verified /> Verified by WTC Accra</span> : humanize(profile.verification_status)}</dd></div>
          <div><dt>Account status</dt><dd>{humanize(profile.account_status)}</dd></div>
          <div><dt>Browsing</dt><dd>{profile.can_view_opportunities ? 'Allowed' : 'Paused by WTC Accra'}</dd></div>
          <div><dt>Posting</dt><dd>{profile.can_post_opportunities ? 'Allowed' : 'Paused by WTC Accra'}</dd></div>
          <div><dt>Open interest received</dt><dd>{openInterest ?? 0}</dd></div>
        </dl>
      </div>
    </section>
  </div>
}
