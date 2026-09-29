import { requireAdminProfile } from '@/lib/auth/guards'
import { dateTime } from '@/lib/format'
import { humanize } from '@/lib/auth/access'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export const dynamic = 'force-dynamic'

export default async function SecurityMonitorPage() {
  const { supabase } = await requireAdminProfile()
  const [{ data: events }, { count: lastHour }, { count: critical24h }] = await Promise.all([
    supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('security_events').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 3600_000).toISOString()),
    supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('severity', 'critical').gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
  ])

  return <div className="page-stack">
    <RealtimeRefresh tables={['security_events']} />
    <div>
      <p className="eyebrow">Security Monitoring</p>
      <h1>Security Events</h1>
      <p className="muted">Rate-limit blocks and other security controls are recorded here for administrator review.</p>
    </div>
    <section className="dashboard-grid super-metrics">
      <article className="metric-card"><span>Last Hour</span><strong>{lastHour ?? 0}</strong><p>Blocked or security-relevant events</p></article>
      <article className="metric-card"><span>Critical · 24 Hours</span><strong>{critical24h ?? 0}</strong><p>Repeated or high-volume abuse signals</p></article>
      <article className="metric-card"><span>Recorded</span><strong>{events?.length ?? 0}</strong><p>Most recent events loaded</p></article>
    </section>
    <section className="card table-wrap">
      <h2>Recent Security Activity</h2>
      {(events ?? []).length === 0 ? <p className="muted">No security events have been recorded.</p> : <table className="data-table">
        <thead><tr><th>When</th><th>Severity</th><th>Event</th><th>Bucket</th><th>Subject</th><th>Details</th></tr></thead>
        <tbody>{(events ?? []).map(event => <tr key={event.id}>
          <td>{dateTime(event.created_at)}</td>
          <td><span className={`status-dot status-${event.severity}`}>{humanize(event.severity)}</span></td>
          <td><strong>{humanize(event.event_type)}</strong></td>
          <td>{event.bucket ?? '—'}</td>
          <td><code>{event.subject_hash ? event.subject_hash.slice(0, 14) + '…' : '—'}</code></td>
          <td><code>{JSON.stringify(event.details)}</code></td>
        </tr>)}</tbody>
      </table>}
    </section>
  </div>
}
