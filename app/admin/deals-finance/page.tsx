import Link from 'next/link'
import { requireAnyCapability } from '@/lib/auth/guards'
import { money, dateTime } from '@/lib/format'
import { humanize } from '@/lib/auth/access'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
type Room = { id: string; opportunity_id: string; status: string; created_at: string; closed_at: string | null; deal_value: number | null; deal_currency: string | null; success_fee_amount: number | null; deal_value_usd: number | null; success_fee_amount_usd: number | null; success_fee_rate: number | null }

export default async function DealsFinancePage({ searchParams }: Props) {
  const { supabase, capabilities } = await requireAnyCapability(['finance', 'opportunities', 'verification'])
  const params = await searchParams
  const status = typeof params.status === 'string' && ['all', 'active', 'closed'].includes(params.status) ? params.status : 'all'
  const finance = capabilities.has('finance')
  const { data, error } = await supabase.from('deal_rooms').select('id,opportunity_id,status,created_at,closed_at,deal_value,deal_currency,success_fee_amount,deal_value_usd,success_fee_amount_usd,success_fee_rate').order('created_at', { ascending: false }).limit(1000)
  const rooms = (data ?? []) as Room[]
  const oppIds = [...new Set(rooms.map(r => r.opportunity_id))]
  const { data: opportunities } = oppIds.length
    ? await supabase.from('opportunities').select('id,title,owner_user_id').in('id', oppIds)
    : { data: [] }
  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))
  const closed = rooms.filter(r => r.status === 'closed')
  const active = rooms.filter(r => r.status === 'active')
  const feeRecorded = closed.filter(r => r.success_fee_amount_usd != null || (r.deal_currency === 'USD' && r.success_fee_amount != null))
  const totalUsd = closed.reduce((sum, r) => sum + (Number(r.deal_value_usd) || (r.deal_currency === 'USD' ? Number(r.deal_value) || 0 : 0)), 0)
  const feesUsd = feeRecorded.reduce((sum, r) => sum + (Number(r.success_fee_amount_usd) || (r.deal_currency === 'USD' ? Number(r.success_fee_amount) || 0 : 0)), 0)
  const rows = rooms.filter(r => status === 'all' || r.status === status)
  return <div className="page-stack">
    <RealtimeRefresh tables={['deal_rooms','opportunities']} />
    <div>
      <p className="eyebrow">WTC Accra — Controlled transactions</p>
      <h1>Deals & Finance</h1>
      <p className="muted">Monitor Deal Rooms, confirmed transaction values, and recorded success-fee calculations. Settlement status is not inferred from deal closure; payment reconciliation requires a separate success-fee ledger.</p>
    </div>
    {error && <div className="alert alert-error">Unable to load Deal Rooms: {error.message}</div>}
    <section className="dashboard-grid">
      <article className="metric-card"><span>Active Deal Rooms</span><strong>{active.length}</strong><p>Transactions in progress</p></article>
      <article className="metric-card"><span>Closed Deal Rooms</span><strong>{closed.length}</strong><p>Recorded closures</p></article>
      {finance && <article className="metric-card"><span>Recorded Closed Deal Value (USD)</span><strong>{money(totalUsd,'USD')}</strong><p>USD values only; unconverted currencies excluded</p></article>}
      {finance && <article className="metric-card"><span>Calculated Success Fees (USD)</span><strong>{money(feesUsd,'USD')}</strong><p>{feeRecorded.length} closure records with calculable USD fee. Not amount paid or outstanding.</p></article>}
    </section>
    <section className="card">
      <h2>Financial control checkpoints</h2>
      <p className="muted">A closed Deal Room does not establish that an invoice has been issued or paid. Finance must independently validate the liable party, signed fee agreement, eligible completed amount, evidence, invoice, partial payments, and any dispute before enforcing collection.</p>
      <div className="button-row">
        {finance && <Link className="button button-outline" href="/admin/payments">Existing Payment Records</Link>}
        <Link className="button button-outline" href="/admin/deals">Review Deal Requests</Link>
        <Link className="button button-outline" href="/admin/introductions">Introduction Workflow</Link>
      </div>
    </section>
    <nav className="queue-tabs">
      {['all','active','closed'].map(s => <Link key={s} href={`/admin/deals-finance?status=${s}`} className={status === s ? 'queue-tab queue-tab-active' : 'queue-tab'}>{humanize(s)}<span>{s === 'all' ? rooms.length : s === 'active' ? active.length : closed.length}</span></Link>)}
    </nav>
    <section className="card">
      <h2>Deal Room Register</h2>
      {!rows.length ? <p className="muted">No Deal Rooms in this view.</p> : <div className="history-list compact">
        {rows.map(room => <div key={room.id}>
          <strong><Link href={`/dashboard/deal-rooms/${room.id}`}>{oppById.get(room.opportunity_id)?.title ?? 'Deal Room'}</Link></strong>
          <span>{humanize(room.status)} · {dateTime(room.closed_at ?? room.created_at)}</span>
          <p className="muted">Reference: {room.id} {finance && room.status === 'closed' ? ` · Verified value: ${money(room.deal_value ?? 0, room.deal_currency ?? 'USD')} · Calculated fee: ${room.success_fee_amount == null ? 'not recorded' : money(room.success_fee_amount, room.deal_currency ?? 'USD')}` : ''}</p>
        </div>)}
      </div>}
    </section>
  </div>
}
