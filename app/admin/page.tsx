import Link from 'next/link'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { requireStaffConsole } from '@/lib/auth/guards'
import { hasCapability, isAdminRole, humanize } from '@/lib/auth/access'
import { money, dateTime, date } from '@/lib/format'

export const dynamic = 'force-dynamic'

type Tally = Record<string, number>

/* One grouped count per table so the overview shows both what is waiting
   and what has already moved through each queue. */
async function tally(supabase: Awaited<ReturnType<typeof requireStaffConsole>>['supabase'], table: 'verification_requests' | 'opportunities' | 'subscriptions' | 'expressions_of_interest' | 'support_requests' | 'payments' | 'profiles' | 'introductions', column = 'status'): Promise<Tally> {
  const { data } = await supabase.from(table).select(column).limit(5000)
  const out: Tally = {}
  for (const row of (data ?? []) as unknown as Record<string, string | null>[]) { const k = row[column] ?? 'unknown'; out[k] = (out[k] ?? 0) + 1 }
  return out
}
const sum = (t: Tally, keys?: string[]) => (keys ?? Object.keys(t)).reduce((n, k) => n + (t[k] ?? 0), 0)
const breakdown = (t: Tally, order: string[]) => order.filter(k => t[k]).map(k => `${t[k]} ${humanize(k).toLowerCase()}`).join(' · ') || 'nothing yet'

export default async function AdminPage() {
  const { supabase, profile } = await requireStaffConsole()
  const role = profile.system_role
  const admin = isAdminRole(role)

  const [vr, opp, subs, bids, support, pay, intros, members, verif, { data: plans }, { data: activeSubs }, { data: paidRows }, { data: recentAudit }, { data: staffNotes }, { data: latestMembers }, { data: latestListings }] = await Promise.all([
    tally(supabase, 'verification_requests'), tally(supabase, 'opportunities'), tally(supabase, 'subscriptions'),
    tally(supabase, 'expressions_of_interest'), tally(supabase, 'support_requests'), tally(supabase, 'payments'), tally(supabase, 'introductions'),
    tally(supabase, 'profiles', 'account_status'), tally(supabase, 'profiles', 'verification_status'),
    supabase.from('subscription_plans').select('code,price_usd'),
    supabase.from('subscriptions').select('plan_code').eq('status', 'active'),
    supabase.from('payments').select('amount,paid_at').eq('status', 'paid'),
    admin ? supabase.from('audit_events').select('*').order('created_at', { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
    supabase.from('notifications').select('id,title,body,href,created_at,read_at').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(8),
    supabase.from('profiles').select('id,full_name,participant_type,verification_status,created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('opportunities').select('id,title,status,updated_at').order('updated_at', { ascending: false }).limit(5),
  ])
  const priceByCode = new Map((plans ?? []).map(p => [p.code, Number(p.price_usd)]))
  const recurringValue = (activeSubs ?? []).reduce((s, x) => s + (priceByCode.get(x.plan_code) ?? 0), 0)
  const received = (paidRows ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const receivedThisMonth = (paidRows ?? []).filter(p => p.paid_at && new Date(p.paid_at).getMonth() === new Date().getMonth() && new Date(p.paid_at).getFullYear() === new Date().getFullYear()).reduce((s, p) => s + Number(p.amount), 0)

  const actorIds = [...new Set((recentAudit ?? []).map(e => e.actor_id).filter((x): x is string => !!x))]
  const { data: actors } = actorIds.length ? await supabase.from('profiles').select('id,full_name').in('id', actorIds) : { data: [] }
  const actorName = new Map((actors ?? []).map(a => [a.id, a.full_name]))

  const queues = [
    { label: 'Verification requests', waiting: vr.pending_review ?? 0, total: sum(vr), detail: breakdown(vr, ['pending_review', 'verified', 'changes_requested', 'rejected']), href: '/admin/verification', show: hasCapability(role, 'verification') },
    { label: 'Opportunities to review', waiting: (opp.submitted ?? 0) + (opp.in_review ?? 0), total: sum(opp), detail: breakdown(opp, ['submitted', 'in_review', 'published', 'changes_requested', 'rejected', 'draft']), href: '/admin/opportunities', show: hasCapability(role, 'opportunities') },
    { label: 'Bids awaiting due diligence', waiting: bids.submitted ?? 0, total: sum(bids), detail: breakdown(bids, ['submitted', 'under_review', 'accepted', 'declined', 'withdrawn']), href: '/admin/bids', show: hasCapability(role, 'opportunities') },
    { label: 'Introductions to arrange', waiting: (intros.requested ?? 0) + (intros.approved ?? 0), total: sum(intros), detail: breakdown(intros, ['requested', 'approved', 'introduced', 'meeting_scheduled', 'completed', 'declined']), href: '/admin/introductions', show: hasCapability(role, 'introductions') },
    { label: 'Payments to confirm', waiting: pay.pending ?? 0, total: sum(pay), detail: breakdown(pay, ['pending', 'paid', 'failed', 'cancelled', 'refunded']), href: '/admin/payments', show: hasCapability(role, 'finance') },
    { label: 'Plans awaiting approval', waiting: (subs.awaiting_approval ?? 0) + (subs.pending ?? 0), total: sum(subs), detail: breakdown(subs, ['awaiting_approval', 'pending', 'active', 'expired', 'cancelled']), href: '/admin/subscriptions', show: hasCapability(role, 'finance') },
    { label: 'Open support requests', waiting: (support.open ?? 0) + (support.in_progress ?? 0), total: sum(support), detail: breakdown(support, ['open', 'in_progress', 'resolved', 'closed']), href: '/admin/support', show: hasCapability(role, 'support') },
  ].filter(q => q.show)
  const waitingTotal = queues.reduce((n, q) => n + q.waiting, 0)

  return <div className="page-stack">
    <RealtimeRefresh tables={["profiles","subscriptions","payments","opportunities","expressions_of_interest","verification_requests","support_requests","audit_events","notifications","introductions"]} />
    <div>
      <p className="eyebrow">WTC Accra administration</p>
      <h1>Platform control centre</h1>
      <p className="muted">{waitingTotal === 0 ? 'Nothing is waiting on you right now.' : `${waitingTotal} item${waitingTotal === 1 ? '' : 's'} waiting on staff.`} Figures update live as members act.</p>
    </div>

    <section className="dashboard-grid">
      {queues.map(q => <article className={q.waiting > 0 ? 'metric-card metric-card-alert' : 'metric-card'} key={q.label}>
        <span>{q.label}</span>
        <strong>{q.waiting}<small className="metric-sub"> waiting · {q.total} total</small></strong>
        <p>{q.detail}</p>
        <Link href={q.href}>Open queue →</Link>
      </article>)}
    </section>

    <section className="dashboard-grid">
      <article className="metric-card"><span>Members</span><strong>{sum(members)}</strong><p>{verif.verified ?? 0} verified · {verif.pending_review ?? 0} in review · {members.active ?? 0} active accounts{(members.suspended ?? 0) + (members.disabled ?? 0) > 0 ? ` · ${(members.suspended ?? 0) + (members.disabled ?? 0)} blocked` : ''}</p><Link href="/admin/users">Members →</Link></article>
      <article className="metric-card"><span>Active subscriptions</span><strong>{subs.active ?? 0}</strong><p>{hasCapability(role, 'finance') ? `Annual list value ${money(recurringValue)}` : 'Members with marketplace access'}{subs.expired ? ` · ${subs.expired} expired` : ''}</p><Link href="/admin/subscriptions?status=active">Subscriptions →</Link></article>
      {hasCapability(role, 'finance') && <article className="metric-card"><span>Payments received</span><strong>{money(received)}</strong><p>{pay.paid ?? 0} payment{(pay.paid ?? 0) === 1 ? '' : 's'} · {money(receivedThisMonth)} this month</p><Link href="/admin/payments?status=paid">Payments →</Link></article>}
      <article className="metric-card"><span>Live listings</span><strong>{opp.published ?? 0}</strong><p>{sum(bids)} bid{sum(bids) === 1 ? '' : 's'} placed · {bids.accepted ?? 0} accepted by owners</p><Link href="/opportunities">Public listings →</Link></article>
    </section>

    <div className="split-grid admin-detail-grid">
      <section className="card">
        <h2>Latest members</h2>
        <div className="history-list compact">{(latestMembers ?? []).map(m => <div key={m.id}>
          <strong><Link href={`/admin/users/${m.id}`}>{m.full_name || 'Unnamed'}</Link></strong><span>{date(m.created_at)}</span>
          <p className="muted">{humanize(m.participant_type)} · {humanize(m.verification_status)}</p>
        </div>)}</div>
        <h2>Latest listings</h2>
        <div className="history-list compact">{(latestListings ?? []).map(l => <div key={l.id}>
          <strong><Link href={`/admin/opportunities?status=${l.status}`}>{l.title}</Link></strong><span className={`status-dot status-opp-${l.status}`}>{humanize(l.status)}</span>
          <p className="muted">Updated {dateTime(l.updated_at)}</p>
        </div>)}</div>
      </section>

      <section className="card">
        <h2>Activity</h2>
        {(staffNotes ?? []).length > 0 && <div className="history-list compact">{(staffNotes ?? []).map(n => <div key={n.id}>
          <strong>{n.href ? <Link href={n.href}>{n.title}</Link> : n.title}</strong><span>{dateTime(n.created_at)}</span>
          {n.body && <p className="muted">{n.body}</p>}
        </div>)}</div>}
        {admin && (recentAudit ?? []).length > 0 && <>
          <h3>Audit trail</h3>
          <div className="history-list compact">{(recentAudit ?? []).map(e => <div key={e.id}>
            <strong>{humanize(e.action.replaceAll('.', ' '))}</strong><span>{dateTime(e.created_at)}</span>
            <p className="muted">{humanize(e.entity_type)} · {e.actor_id ? actorName.get(e.actor_id) ?? 'Unknown' : 'System'}</p>
          </div>)}</div>
          <Link className="arrow-link" href="/admin/audit">Full audit log →</Link>
        </>}
        {(staffNotes ?? []).length === 0 && (recentAudit ?? []).length === 0 && <p className="muted">No activity yet.</p>}
      </section>
    </div>
  </div>
}
