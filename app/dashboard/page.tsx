import Link from 'next/link'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLock, postingLock, labelForParticipantType, humanize } from '@/lib/auth/access'
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

  const browse = state ? marketplaceLock(state) : null
  const post = state ? postingLock(state) : null
  const steps = [
    { done: profile.profile_completed, label: 'Complete your profile', href: '/dashboard/profile' },
    { done: profile.verification_status === 'verified', label: 'Pass WTC Accra verification', href: '/dashboard/verification' },
    { done: !!state?.has_active_subscription, label: 'Activate a subscription', href: '/dashboard/billing' },
  ]

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Member dashboard</p>
      <h1>Welcome, {displayName}</h1>
      <p className="muted">Your WTC Accra trade and investment workspace.</p>
    </div>

    {browse?.locked && <section className="restriction-banner">
      <div><strong>Marketplace access is restricted</strong><p>{browse.reason}</p></div>
      {browse.action && <Link className="button button-light" href={browse.action.href}>{browse.action.label}</Link>}
    </section>}

    <section className="dashboard-grid">
      <article className="metric-card">
        <span>Verification</span>
        <strong>{humanize(profile.verification_status)}</strong>
        <p>{profile.verification_status === 'verified' ? 'Your participant privileges are active.' : 'Required before any marketplace activity.'}</p>
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

    <section className="card">
      <h2>Getting to full access</h2>
      <p className="muted">Three gates stand between a new account and the private marketplace.</p>
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
          <div><dt>Participant type</dt><dd>{labelForParticipantType(profile.participant_type)}</dd></div>
          <div><dt>Requested type</dt><dd>{labelForParticipantType(profile.requested_participant_type)}</dd></div>
          <div><dt>Account status</dt><dd>{humanize(profile.account_status)}</dd></div>
          <div><dt>Browsing</dt><dd>{profile.can_view_opportunities ? 'Allowed' : 'Paused by WTC Accra'}</dd></div>
          <div><dt>Posting</dt><dd>{profile.can_post_opportunities ? 'Allowed' : 'Paused by WTC Accra'}</dd></div>
          <div><dt>Open interest received</dt><dd>{openInterest ?? 0}</dd></div>
        </dl>
      </div>
    </section>
  </div>
}
