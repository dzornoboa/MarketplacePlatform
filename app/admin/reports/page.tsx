import { requireCapability } from '@/lib/auth/guards'
import { ReportTable } from '@/components/report-table'
import { adminReport, ADMIN_REPORTS, reportLabel, type AdminReport, type ReportParams } from '@/lib/reports'
import { selectableParticipantTypes, participantTypeLabels, verificationStatuses, accountStatuses, humanize } from '@/lib/auth/access'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const STATUS_OPTIONS: Record<string, readonly string[]> = {
  subscriptions: ['active', 'pending', 'awaiting_approval', 'expired', 'cancelled'],
  payments: ['pending', 'paid', 'failed', 'refunded'],
  listings: ['draft', 'submitted', 'changes_requested', 'published', 'withdrawn', 'closed'],
  bids: ['submitted', 'under_review', 'cleared', 'accepted', 'declined', 'withdrawn'],
  verification: verificationStatuses,
}

/* Platform-wide reports for staff with the reports capability (admins and
   super admins always). Filters live in the query string so the CSV matches. */
export default async function AdminReportsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('reports')
  const raw = await searchParams
  const params: ReportParams = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? v : undefined]))
  const kind = (ADMIN_REPORTS as readonly string[]).includes(params.kind ?? '') ? (params.kind as AdminReport) : 'members'
  const [report, { data: plans }] = await Promise.all([adminReport(supabase, kind, params), supabase.from('subscription_plans').select('code,name').order('price_usd')])
  const csv = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])); csv.set('kind', kind); csv.set('scope', 'admin')
  const memberLink = (r: Record<string, string | number | null>) => r.user_id ? `/admin/users/${r.user_id}` : kind === 'members' ? `/admin/users/${r.id}` : null

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Reports</p>
      <h1>Platform reports</h1>
      <p className="muted">Members, plans, payments, listings, bids and verification — filter, sort and export.</p>
    </div>
    <nav className="queue-tabs">{ADMIN_REPORTS.map(k => <a key={k} className={k === kind ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/reports?kind=${k}`}>{reportLabel(k)}</a>)}</nav>
    <form className="report-filters" method="get" action="/admin/reports">
      <input type="hidden" name="kind" value={kind} />
      {params.from && <input type="hidden" name="from" value={params.from} />}{params.to && <input type="hidden" name="to" value={params.to} />}
      {kind === 'members' && <>
        <label>Type<select name="type" defaultValue={params.type ?? ''}><option value="">All</option>{selectableParticipantTypes.map(t => <option key={t} value={t}>{participantTypeLabels[t]}</option>)}</select></label>
        <label>Verified check<select name="status" defaultValue={params.status ?? ''}><option value="">All</option>{verificationStatuses.map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></label>
        <label>Account<select name="account" defaultValue={params.account ?? ''}><option value="">All</option>{accountStatuses.map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></label>
        <label>Plan<select name="plan" defaultValue={params.plan ?? ''}><option value="">All</option><option value="none">No plan</option>{(plans ?? []).map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></label>
      </>}
      {kind !== 'members' && STATUS_OPTIONS[kind] && <label>Status<select name="status" defaultValue={params.status ?? ''}><option value="">All</option>{STATUS_OPTIONS[kind].map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></label>}
      {kind === 'subscriptions' && <label>Plan<select name="plan" defaultValue={params.plan ?? ''}><option value="">All</option>{(plans ?? []).map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></label>}
      <button className="button button-outline" type="submit">Filter</button>
    </form>
    <ReportTable report={report} base="/admin/reports" params={{ ...params, kind }} csvHref={`/api/reports?${csv.toString()}`} linkRow={memberLink} />
  </div>
}
