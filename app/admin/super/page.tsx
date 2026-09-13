import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { humanize, labelForParticipantType, systemRoleLabels, labelForIntent } from '@/lib/auth/access'
import { money, date, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/* Everything a super administrator needs on one page: who exists, exactly what
   each account can do, and every change made to the platform and the public
   website. Read-only by design — actions live on the pages that own them, so
   there is a single place each change is made and audited. */
export default async function SuperAdminPage({ searchParams }: Props) {
  const { supabase, profile: me } = await requireSuperAdmin()
  const params = await searchParams
  const tab = typeof params.tab === 'string' ? params.tab : 'accounts'

  const [{ data: profiles }, { data: audit }, { data: subs }, { data: opportunities }, { data: posts }, { data: blocks }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('audit_events').select('*').order('created_at', { ascending: false }).limit(60),
    supabase.from('subscriptions').select('user_id,plan_code,status,ends_at'),
    supabase.from('opportunities').select('id,title,status,intent,owner_user_id,capital_required,currency,updated_at').order('updated_at', { ascending: false }).limit(40),
    supabase.from('content_posts').select('id,title,status,category,updated_at,author_id').order('updated_at', { ascending: false }).limit(20),
    supabase.from('site_content_blocks').select('page_slug,section_key,updated_at,updated_by,is_published').order('updated_at', { ascending: false }).limit(25),
  ])

  const nameById = new Map((profiles ?? []).map(p => [p.id, p.full_name || 'Unnamed']))
  const subByUser = new Map((subs ?? []).filter(s => s.status === 'active').map(s => [s.user_id, s]))
  const people = profiles ?? []

  const totals = {
    accounts: people.length,
    staff: people.filter(p => p.system_role !== 'user').length,
    verified: people.filter(p => p.verification_status === 'verified').length,
    blocked: people.filter(p => !p.can_view_opportunities || !p.can_post_opportunities).length,
    suspended: people.filter(p => p.account_status !== 'active').length,
    subscribed: (subs ?? []).filter(s => s.status === 'active').length,
  }

  const tabs = [
    { key: 'accounts', label: 'Accounts and access' },
    { key: 'activity', label: 'Audit trail' },
    { key: 'content', label: 'Website and content edits' },
    { key: 'market', label: 'Marketplace' },
  ]

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Super administration</p>
      <h1>Everything, in one place</h1>
      <p className="muted">Full oversight of accounts, access, audit history and every edit made to the public website. Signed in as {me.full_name}.</p>
    </div>

    <section className="dashboard-grid super-metrics">
      <article className="metric-card"><span>Accounts</span><strong>{totals.accounts}</strong><p>{totals.staff} staff · {totals.accounts - totals.staff} members</p></article>
      <article className="metric-card"><span>Verified</span><strong>{totals.verified}</strong><p>{totals.subscribed} with an active subscription</p></article>
      <article className="metric-card"><span>Restricted</span><strong>{totals.blocked + totals.suspended}</strong><p>{totals.blocked} access-limited · {totals.suspended} not active</p></article>
    </section>

    <nav className="queue-tabs">
      {tabs.map(t => <a key={t.key} className={t.key === tab ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/super?tab=${t.key}`}>{t.label}</a>)}
    </nav>

    {tab === 'accounts' && <section className="card table-wrap">
      <h2>Every account and what it can do</h2>
      <p className="muted">Change any of this from <Link className="arrow-link" href="/admin/users">Members</Link>.</p>
      <table className="data-table">
        <thead><tr>
          <th>Name</th><th>Role</th><th>Participant</th><th>Account</th><th>Verification</th>
          <th>Browse</th><th>Post</th><th>Subscription</th><th>Joined</th>
        </tr></thead>
        <tbody>{people.map(person => {
          const sub = subByUser.get(person.id)
          return <tr key={person.id}>
            <td><strong><Link href={`/admin/users/${person.id}`}>{person.full_name || 'Unnamed'}</Link></strong>{person.id === me.id && <span className="thread-badge">You</span>}</td>
            <td>{systemRoleLabels[person.system_role] ?? person.system_role}</td>
            <td>{labelForParticipantType(person.participant_type)}</td>
            <td><span className={`status-dot status-${person.account_status}`}>{humanize(person.account_status)}</span></td>
            <td><span className={`status-dot status-${person.verification_status}`}>{humanize(person.verification_status)}</span></td>
            <td>{person.can_view_opportunities ? 'Yes' : <strong className="flag-blocked">Blocked</strong>}</td>
            <td>{person.can_post_opportunities ? 'Yes' : <strong className="flag-blocked">Blocked</strong>}</td>
            <td>{sub ? `${sub.plan_code.replaceAll('_', ' ')} · to ${date(sub.ends_at)}` : '—'}</td>
            <td>{date(person.created_at)}</td>
          </tr>
        })}</tbody>
      </table>
    </section>}

    {tab === 'activity' && <section className="card table-wrap">
      <h2>Audit trail</h2>
      <p className="muted">Every verification decision, access change, role change and review, with the administrator who made it.</p>
      {(audit ?? []).length === 0
        ? <p className="muted">No administrative actions recorded yet.</p>
        : <table className="data-table">
            <thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Actor</th><th>Details</th></tr></thead>
            <tbody>{(audit ?? []).map(event => <tr key={event.id}>
              <td>{dateTime(event.created_at)}</td>
              <td><strong>{event.action}</strong></td>
              <td>{humanize(event.entity_type)}</td>
              <td>{event.actor_id ? nameById.get(event.actor_id) ?? 'Unknown' : 'System'}</td>
              <td><code>{JSON.stringify(event.details)}</code></td>
            </tr>)}</tbody>
          </table>}
      <Link className="arrow-link" href="/admin/audit">Full audit log →</Link>
    </section>}

    {tab === 'content' && <section className="split-grid">
      <div className="card table-wrap">
        <h2>Public website sections</h2>
        <p className="muted">Most recently edited blocks across every public page.</p>
        <table className="data-table">
          <thead><tr><th>Page</th><th>Section</th><th>Live</th><th>Edited</th><th>By</th></tr></thead>
          <tbody>{(blocks ?? []).map(block => <tr key={`${block.page_slug}-${block.section_key}`}>
            <td>{humanize(block.page_slug)}</td>
            <td><strong>{humanize(block.section_key)}</strong></td>
            <td>{block.is_published ? 'Yes' : 'Hidden'}</td>
            <td>{dateTime(block.updated_at)}</td>
            <td>{block.updated_by ? nameById.get(block.updated_by) ?? 'Editor' : '—'}</td>
          </tr>)}</tbody>
        </table>
        <Link className="arrow-link" href="/editor/pages">Edit page sections →</Link>
      </div>
      <div className="card table-wrap">
        <h2>News and resources</h2>
        <table className="data-table">
          <thead><tr><th>Title</th><th>Status</th><th>Edited</th><th>By</th></tr></thead>
          <tbody>{(posts ?? []).map(post => <tr key={post.id}>
            <td><strong>{post.title}</strong></td>
            <td><span className={`status-dot status-content-${post.status}`}>{humanize(post.status)}</span></td>
            <td>{dateTime(post.updated_at)}</td>
            <td>{post.author_id ? nameById.get(post.author_id) ?? 'Editor' : '—'}</td>
          </tr>)}</tbody>
        </table>
        <Link className="arrow-link" href="/editor/news">Manage articles →</Link>
      </div>
    </section>}

    {tab === 'market' && <section className="card table-wrap">
      <h2>Every listing</h2>
      <p className="muted">Across all statuses, including drafts that no member can see.</p>
      {(opportunities ?? []).length === 0
        ? <div className="empty-state"><BrandCircle /><h2>No listings yet</h2><p>Posted opportunities will appear here at every stage.</p></div>
        : <table className="data-table">
            <thead><tr><th>Title</th><th>Posted as</th><th>Status</th><th>Owner</th><th>Capital</th><th>Updated</th></tr></thead>
            <tbody>{(opportunities ?? []).map(item => <tr key={item.id}>
              <td><strong>{item.title}</strong></td>
              <td>{labelForIntent(item.intent)}</td>
              <td><span className={`status-dot status-opp-${item.status}`}>{humanize(item.status)}</span></td>
              <td>{nameById.get(item.owner_user_id) ?? 'Member'}</td>
              <td>{money(item.capital_required, item.currency)}</td>
              <td>{dateTime(item.updated_at)}</td>
            </tr>)}</tbody>
          </table>}
      <Link className="arrow-link" href="/admin/opportunities">Review queue →</Link>
    </section>}
  </div>
}
