import Link from 'next/link'
import { requireStaffConsole } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { BarChart, LineChart, Donut, Funnel, chartColors } from '@/components/charts'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { money } from '@/lib/format'
import { gatherInsights, commentary } from '@/lib/ai/insights'
import { aiAvailable } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

const toData = (obj: Record<string, number>, label: (k: string) => string = humanize) =>
  Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: label(k), value: v }))

/* KPIs and charts computed live from the database, with commentary from
   Claude (or rules when no API key is configured). */
export default async function AdminInsightsPage() {
  const { supabase } = await requireStaffConsole()
  const data = await gatherInsights(supabase)
  const notes = await commentary(data)
  const k = data.kpis

  return <div className="page-stack">
    <RealtimeRefresh tables={["profiles","subscriptions","payments","opportunities","expressions_of_interest","verification_requests"]} />
    <div>
      <p className="eyebrow">Insights</p>
      <h1>KPIs and deal flow</h1>
      <p className="muted">Everything below is computed from the live database on each visit. Charts cover the last six months.</p>
    </div>

    <section className="card ai-summary">
      <h2>What the numbers say <span className="ai-badge">{notes.source === 'claude' ? 'AI · Claude' : 'Automated'}</span></h2>
      <ul>{notes.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
      {!aiAvailable() && <p className="field-help">Set ANTHROPIC_API_KEY to get Claude-written commentary with recommendations. <Link href="/admin/assistant">About the AI assistant →</Link></p>}
    </section>

    <section className="dashboard-grid">
      <article className="metric-card"><span>Members</span><strong>{k.members}</strong><p>{k.verified} verified</p></article>
      <article className="metric-card"><span>Active plans</span><strong>{k.activeSubs}</strong><p>{money(k.arr)} annual value{k.expiringSoon ? ` · ${k.expiringSoon} ending soon` : ''}</p></article>
      <article className="metric-card"><span>Payments received</span><strong>{money(k.revenue)}</strong><p>{money(k.revenueThisMonth)} this month</p></article>
      <article className="metric-card"><span>Live listings</span><strong>{k.published}</strong><p>{money(k.dealValue)} capital sought</p></article>
      <article className="metric-card"><span>Bids</span><strong>{k.bids}</strong><p>{k.bidsAccepted} accepted by owners</p></article>
      <article className="metric-card"><span>Connections</span><strong>{k.connections}</strong><p>{k.matches} automatic matches</p></article>
      <article className="metric-card"><span>Verification speed</span><strong>{k.avgReviewDays === null ? '—' : k.avgReviewDays < 1 ? '<1 day' : `${k.avgReviewDays.toFixed(1)} d`}</strong><p>Average time to decision</p></article>
      <article className="metric-card"><span>Support</span><strong>{k.openSupport}</strong><p>Open requests</p></article>
    </section>

    <div className="insight-grid">
      <section className="card"><LineChart title="Sign-ups and verifications" labels={data.months} series={[{ name: 'Sign-ups', values: data.series.signups, color: chartColors.NAVY }, { name: 'Verified', values: data.series.verifications, color: chartColors.TEAL }]} /></section>
      <section className="card"><LineChart title="Payments received (US$)" labels={data.months} money series={[{ name: 'Revenue', values: data.series.revenue, color: chartColors.ORANGE }]} /></section>
      <section className="card"><LineChart title="Deal flow" labels={data.months} series={[{ name: 'Listings published', values: data.series.listings, color: chartColors.NAVY }, { name: 'Bids placed', values: data.series.bids, color: chartColors.GOLD }]} /></section>
      <section className="card"><Funnel title="Member funnel" steps={[{ label: 'Signed up', value: data.funnel.signups }, { label: 'Verified', value: data.funnel.verified }, { label: 'Subscribed', value: data.funnel.subscribed }, { label: 'Listings with bids', value: data.funnel.bidders }]} /></section>
      <section className="card"><Donut title="Members by type" data={toData(data.breakdowns.membersByType, labelForParticipantType)} /></section>
      <section className="card"><Donut title="Active plans" data={toData(data.breakdowns.subsByPlan, s => s)} /></section>
      <section className="card"><BarChart title="Listings by status" data={toData(data.breakdowns.listingsByStatus)} /></section>
      <section className="card"><BarChart title="Bids by stage" data={toData(data.breakdowns.bidsByStatus)} /></section>
      <section className="card"><BarChart title="Live listings by sector" data={toData(data.breakdowns.listingsBySector, s => s)} /></section>
      <section className="card"><BarChart title="Payments by method" data={toData(data.breakdowns.paymentsByMethod)} /></section>
    </div>

    <section className="card">
      <h2>Top listings</h2>
      {data.topListings.length === 0 ? <p className="muted">No live listings yet.</p> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Listing</th><th>Sector</th><th>Rating</th><th>Capital</th><th>Bids</th></tr></thead>
        <tbody>{data.topListings.map(l => <tr key={l.id}><td><Link href={`/opportunities/${l.id}`}>{l.title}</Link></td><td>{l.sector}</td><td>{'★'.repeat(l.importance)}</td><td>{money(l.value)}</td><td>{l.bids}</td></tr>)}</tbody>
      </table></div>}
    </section>
  </div>
}
