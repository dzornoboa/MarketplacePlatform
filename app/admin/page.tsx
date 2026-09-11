import Link from 'next/link'
import { requireStaffConsole } from '@/lib/auth/guards'
import { hasCapability, isAdminRole, humanize } from '@/lib/auth/access'
import { money, dateTime } from '@/lib/format'

export const dynamic = 'force-dynamic'

async function countOf(
  supabase: Awaited<ReturnType<typeof requireStaffConsole>>['supabase'],
  table: 'verification_requests' | 'opportunities' | 'subscriptions' | 'profiles' | 'expressions_of_interest' | 'support_requests',
  column: string, value: string,
) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, value)
  return count ?? 0
}

export default async function AdminPage() {
  const { supabase, profile } = await requireStaffConsole()
  const role = profile.system_role
  const admin = isAdminRole(role)

  const [pendingVerification, submittedOpportunities, publishedOpportunities, pendingSubs, activeSubs, verifiedMembers, totalMembers, openSupport] = await Promise.all([
    countOf(supabase, 'verification_requests', 'status', 'pending_review'),
    countOf(supabase, 'opportunities', 'status', 'submitted'),
    countOf(supabase, 'opportunities', 'status', 'published'),
    countOf(supabase, 'subscriptions', 'status', 'pending'),
    countOf(supabase, 'subscriptions', 'status', 'active'),
    countOf(supabase, 'profiles', 'verification_status', 'verified'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).then(r => r.count ?? 0),
    countOf(supabase, 'support_requests', 'status', 'open'),
  ])

  const { data: plans } = await supabase.from('subscription_plans').select('code,price_usd')
  const { data: active } = await supabase.from('subscriptions').select('plan_code').eq('status', 'active')
  const priceByCode = new Map((plans ?? []).map(p => [p.code, Number(p.price_usd)]))
  const recurringValue = (active ?? []).reduce((sum, s) => sum + (priceByCode.get(s.plan_code) ?? 0), 0)

  const { data: recentAudit } = admin
    ? await supabase.from('audit_events').select('*').order('created_at', { ascending: false }).limit(6)
    : { data: [] }

  const queues = [
    { label: 'Verification requests', value: pendingVerification, href: '/admin/verification', show: hasCapability(role, 'verification'), hint: 'Members waiting on a decision.' },
    { label: 'Opportunities to review', value: submittedOpportunities, href: '/admin/opportunities', show: hasCapability(role, 'opportunities'), hint: 'Submitted listings not yet published.' },
    { label: 'Subscriptions to confirm', value: pendingSubs, href: '/admin/subscriptions', show: hasCapability(role, 'finance'), hint: 'Requested plans awaiting payment confirmation.' },
    { label: 'Open support requests', value: openSupport, href: '/admin', show: hasCapability(role, 'support'), hint: 'Member questions needing a reply.' },
  ].filter(q => q.show)

  return <div className="page-stack">
    <div>
      <p className="eyebrow">WTC Accra administration</p>
      <h1>Platform control centre</h1>
      <p className="muted">Queues assigned to your role, and the health of the marketplace.</p>
    </div>

    {queues.length > 0 && <section className="dashboard-grid">
      {queues.map(queue => <article className="metric-card" key={queue.label}>
        <span>{queue.label}</span>
        <strong>{queue.value}</strong>
        <p>{queue.hint}</p>
        <Link href={queue.href}>Open queue →</Link>
      </article>)}
    </section>}

    <section className="card">
      <h2>Marketplace health</h2>
      <dl className="detail-grid">
        <div><dt>Total members</dt><dd>{totalMembers}</dd></div>
        <div><dt>Verified members</dt><dd>{verifiedMembers}</dd></div>
        <div><dt>Active subscriptions</dt><dd>{activeSubs}</dd></div>
        <div><dt>Published opportunities</dt><dd>{publishedOpportunities}</dd></div>
      </dl>
      {hasCapability(role, 'finance') && <p className="field-help">Annualised list value of active subscriptions: <strong>{money(recurringValue)}</strong></p>}
    </section>

    <section className="card">
      <h2>How access is granted</h2>
      <p className="muted">Three independent gates control what a member can do. All are enforced in the database, not just the interface.</p>
      <ol className="checklist">
        <li><span aria-hidden="true">1</span><span>Verification approves who the member is and assigns their participant type.</span><em>Verification queue</em></li>
        <li><span aria-hidden="true">2</span><span>An active subscription unlocks browsing other members&rsquo; opportunities.</span><em>Subscriptions</em></li>
        <li><span aria-hidden="true">3</span><span>Per-member switches can pause browsing or posting without suspending the account.</span><em>Members</em></li>
      </ol>
    </section>

    {admin && (recentAudit ?? []).length > 0 && <section className="card">
      <h2>Recent administrative activity</h2>
      <div className="history-list">{(recentAudit ?? []).map(event => <div key={event.id}>
        <strong>{event.action}</strong>
        <span>{dateTime(event.created_at)}</span>
        <p className="muted">{humanize(event.entity_type)}</p>
      </div>)}</div>
      <Link className="arrow-link" href="/admin/audit">Full audit log →</Link>
    </section>}
  </div>
}
