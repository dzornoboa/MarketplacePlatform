import { requireUserProfile } from '@/lib/auth/guards'
import { ReportTable } from '@/components/report-table'
import { memberReport, MEMBER_REPORTS, reportLabel, type MemberReport, type ReportParams } from '@/lib/reports'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/* At-a-glance reports on the member's own activity, sortable and exportable. */
export default async function MemberReportsPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const raw = await searchParams
  const params: ReportParams = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' ? v : undefined]))
  const kind = (MEMBER_REPORTS as readonly string[]).includes(params.kind ?? '') ? (params.kind as MemberReport) : 'listings'
  const report = await memberReport(supabase, kind, params, profile.id)
  const csv = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])); csv.set('kind', kind); csv.set('scope', 'member')

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Reports</p>
      <h1>Your activity reports</h1>
      <p className="muted">Sort any column, narrow by date, and download the result as a spreadsheet.</p>
    </div>
    <nav className="queue-tabs">{MEMBER_REPORTS.map(k => <a key={k} className={k === kind ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/dashboard/reports?kind=${k}`}>{reportLabel(k)}</a>)}</nav>
    <ReportTable report={report} base="/dashboard/reports" params={{ ...params, kind }} csvHref={`/api/reports?${csv.toString()}`}
      linkRow={kind === 'listings' ? r => `/dashboard/opportunities/${r.id}` : undefined} />
  </div>
}
