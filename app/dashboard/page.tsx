import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { Avatar } from '@/components/avatar'
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

  const memberExperience = profile.system_role === 'user'
  if (memberExperience) {
    const accessOpen = !!state && !marketplaceLock(state).locked
    const [{ data: news }, listingResult, directoryResult, { data: orgLinks }] = await Promise.all([
      supabase.from('content_posts').select('id,title,slug,excerpt,category,image_url,published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(4),
      accessOpen
        ? supabase.from('opportunities').select('id,title,summary,sector,country,city,kind,intent,currency,capital_required,owner_user_id,published_at').eq('status', 'published').neq('owner_user_id', profile.id).order('published_at', { ascending: false }).limit(5)
        : Promise.resolve({ data: [] }),
      accessOpen
        ? supabase.rpc('member_directory', { search: null, participant: null, member_country: null, only_ids: null, max_rows: 6 })
        : Promise.resolve({ data: [] }),
      supabase.from('organization_members').select('organization_id').eq('user_id', profile.id).limit(1),
    ])
    const liveListings = listingResult.data ?? []
    const suggestedMembers = (directoryResult.data ?? []).filter(person => person.id !== profile.id).slice(0, 4)
    const ownerIds = [...new Set(liveListings.map(item => item.owner_user_id))]
    const { data: owners } = ownerIds.length ? await supabase.rpc('listing_owner_cards', { owner_ids: ownerIds }) : { data: [] }
    const ownerById = new Map((owners ?? []).map(owner => [owner.id, owner]))
    const orgId = orgLinks?.[0]?.organization_id
    const { data: organisation } = orgId
      ? await supabase.from('organizations').select('name,city,country,logo_url').eq('id', orgId).maybeSingle()
      : { data: null }

    return <div className="member-home">
      {browse?.locked && <section className="restriction-banner member-restriction">
        <div><strong>Marketplace Access Is Restricted</strong><p>{browse.reason}</p></div>
        {browse.action && <Link className="button button-light" href={browse.action.href}>{browse.action.label}</Link>}
      </section>}

      <div className="member-home-grid">
        <aside className="member-home-left">
          <section className="member-profile-card">
            <div className="member-profile-cover" />
            <div className="member-profile-body">
              <Link href="/dashboard/profile" className="member-profile-avatar"><Avatar src={profile.avatar_url} name={profile.full_name} size={76} /></Link>
              <h2><Link href="/dashboard/profile">{displayName}</Link><VerifiedCheck verified={profile.verification_status === 'verified'} size={16} /></h2>
              <p>{profile.job_title || labelForParticipantType(profile.participant_type ?? profile.requested_participant_type)}</p>
              <small>{[profile.city, profile.country].filter(Boolean).join(', ') || 'Location Not Set'}</small>
              {organisation?.name && <Link className="member-profile-org" href="/dashboard/organisation"><strong>{organisation.name}</strong></Link>}
            </div>
            <div className="member-profile-stats">
              <Link href="/dashboard/network"><span>Connections</span><strong>{connT.accepted ?? 0}</strong></Link>
              <Link href="/dashboard/saved"><span>Saved Opportunities</span><strong>{(mySaved ?? []).length}</strong></Link>
              <Link href="/dashboard/matches"><span>Matches</span><strong>{(myMatches ?? []).length}</strong></Link>
            </div>
            <Link className="member-profile-footer" href="/dashboard/billing"><span>Membership</span><strong>{state?.subscription_plan_name ?? (state?.has_active_subscription ? 'Active Plan' : 'View Plans')}</strong></Link>
          </section>

          <section className="member-mini-card">
            <strong>Quick Access</strong>
            <Link href="/dashboard/opportunities">Your Listings <span>{myListings ?? 0}</span></Link>
            <Link href="/dashboard/interests">Expressions Of Interest <span>{(myBids ?? []).length}</span></Link>
            <Link href="/dashboard/deal-rooms">Deal Rooms</Link>
            <Link href="/dashboard/reports">Reports</Link>
          </section>
        </aside>

        <main className="member-home-center">
          <section className="member-compose-card">
            <div className="member-compose-start">
              <Avatar src={profile.avatar_url} name={profile.full_name} size={46} />
              <Link href="/dashboard/opportunities/new">Share A Business Opportunity Or Requirement</Link>
            </div>
            <div className="member-compose-actions">
              <Link href="/dashboard/opportunities/new"><span>＋</span> Post Opportunity</Link>
              <Link href="/dashboard/network"><span>◎</span> Find Members</Link>
              <Link href="/dashboard/introductions"><span>↗</span> Request Introduction</Link>
            </div>
          </section>

          <div className="member-feed-tabs">
            <strong>For You</strong>
            <Link href="/dashboard/feed">Network Feed</Link>
          </div>

          {liveListings.length > 0 && liveListings.map(item => {
            const owner = ownerById.get(item.owner_user_id)
            return <article className="member-social-post" key={item.id}>
              <div className="member-post-head">
                <Avatar src={owner?.avatar_url ?? null} name={owner?.full_name ?? 'Member'} size={46} />
                <div>
                  <strong>{owner?.organisation || owner?.full_name || 'Verified Member'}<VerifiedCheck verified={owner?.is_verified ?? false} size={14} /></strong>
                  <span>{owner ? labelForParticipantType(owner.participant_type) : 'WTC Accra Network'} · {item.country}</span>
                  <small>{item.sector} · {humanize(item.kind)}</small>
                </div>
              </div>
              <div className="member-post-content">
                <span className="eyebrow">{item.intent.replaceAll('_', ' ')}</span>
                <h2><Link href={`/dashboard/opportunities/${item.id}`}>{item.title}</Link></h2>
                <p>{item.summary}</p>
                <div className="member-post-facts">
                  <span>{item.city ? `${item.city}, ` : ''}{item.country}</span>
                  {Number(item.capital_required ?? 0) > 0 && <strong>{money(item.capital_required, item.currency)}</strong>}
                </div>
              </div>
              <div className="member-post-actions">
                <Link href={`/dashboard/opportunities/${item.id}`}>View Opportunity</Link>
                <Link href="/dashboard/network">Connect</Link>
                <Link href="/dashboard/saved">Save</Link>
              </div>
            </article>
          })}

          {(news ?? []).length > 0 && <section className="member-news-feed">
            <div className="member-section-title"><h2>WTC News And Resources</h2><Link href="/news">View All →</Link></div>
            {(news ?? []).map(post => <article className="member-social-post member-news-post" key={post.id}>
              {post.image_url && <img src={post.image_url} alt="" />}
              <div className="member-post-content">
                <span className="eyebrow">{post.category === 'resource' ? 'Resource' : 'News'}</span>
                <h2><Link href={`/news/${post.slug}`}>{post.title}</Link></h2>
                {post.excerpt && <p>{post.excerpt}</p>}
              </div>
              <div className="member-post-actions"><Link href={`/news/${post.slug}`}>Read Article</Link><Link href="/news">More News</Link></div>
            </article>)}
          </section>}

          {liveListings.length === 0 && <section className="member-social-post member-empty-feed">
            <h2>{accessOpen ? 'Your Network Feed Is Ready' : 'Complete Membership Setup To Unlock The Marketplace'}</h2>
            <p>{accessOpen ? 'New investment, trade, procurement and partnership opportunities from your network will appear here.' : 'You can still complete your profile, read WTC news and manage your account while access is being activated.'}</p>
            <Link className="button button-primary" href={accessOpen ? '/dashboard/feed' : '/dashboard/billing'}>{accessOpen ? 'Open Network Feed' : 'View Membership'}</Link>
          </section>}
        </main>

        <aside className="member-home-right">
          <section className="member-right-card">
            <div className="member-section-title"><h2>People To Connect With</h2><Link href="/dashboard/network">See All</Link></div>
            {suggestedMembers.length === 0 ? <p className="muted">More verified members will appear as your network grows.</p> : suggestedMembers.map(person => <div className="member-suggestion" key={person.id}>
              <Avatar src={person.avatar_url} name={person.full_name} size={44} />
              <div><strong>{person.full_name}<VerifiedCheck verified={person.is_verified} size={12} /></strong><span>{[person.job_title, person.organisation].filter(Boolean).join(' · ') || labelForParticipantType(person.participant_type)}</span><small>{person.country || 'WTC Network'}</small><Link href="/dashboard/network">+ Connect</Link></div>
            </div>)}
          </section>

          <section className="member-right-card">
            <div className="member-section-title"><h2>Recent Activity</h2><Link href="/dashboard/notifications">View All</Link></div>
            {(notifications ?? []).length === 0 ? <p className="muted">Your verification, deal and network updates will appear here.</p> : <div className="member-activity-list">{(notifications ?? []).slice(0, 4).map(n => <Link key={n.id} href={n.href || '/dashboard/notifications'}><strong>{n.title}</strong><span>{n.body || 'Open notification'}</span></Link>)}</div>}
          </section>

          <section className="member-right-card member-progress-card">
            <h2>Profile And Access</h2>
            <div className="member-progress-meter"><span style={{ width: `${Math.round((steps.filter(step => step.done).length / steps.length) * 100)}%` }} /></div>
            <p>{steps.filter(step => step.done).length} Of {steps.length} Setup Steps Complete</p>
            {steps.filter(step => !step.done).slice(0, 2).map(step => <Link key={step.label} href={step.href}>○ {step.label}</Link>)}
          </section>
        </aside>
      </div>
    </div>
  }

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
