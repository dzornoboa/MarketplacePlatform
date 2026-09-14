import Link from 'next/link'
import type { Report, ReportParams } from '@/lib/reports'

/* Sortable report table with a CSV link. Column headers toggle the sort;
   every filter travels in the query string so the CSV matches the screen. */
export function ReportTable({ report, base, params, csvHref, linkRow }: { report: Report; base: string; params: ReportParams; csvHref: string; linkRow?: (row: Record<string, string | number | null>) => string | null }) {
  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    Object.entries({ ...params, ...patch }).forEach(([k, v]) => { if (v) next.set(k, v) })
    return `${base}?${next.toString()}`
  }
  const sort = params.sort || 'date'
  const dir = params.dir === 'asc' ? 'asc' : 'desc'
  return <section className="card report-card">
    <div className="report-head">
      <div><h2>{report.title}</h2><p className="muted">{report.rows.length.toLocaleString()} row{report.rows.length === 1 ? '' : 's'}{params.from || params.to ? ` · ${params.from ?? '…'} to ${params.to ?? '…'}` : ''}</p></div>
      <a className="button button-outline" href={csvHref} download>Download CSV</a>
    </div>
    <form className="report-filters" method="get" action={base}>
      {Object.entries(params).filter(([k]) => !['from', 'to'].includes(k)).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
      <label>From<input type="date" name="from" defaultValue={params.from ?? ''} /></label>
      <label>To<input type="date" name="to" defaultValue={params.to ?? ''} /></label>
      <button className="button button-outline" type="submit">Apply</button>
      {(params.from || params.to) && <Link className="arrow-link" href={qs({ from: undefined, to: undefined })}>Clear dates</Link>}
    </form>
    {report.rows.length === 0
      ? <p className="muted">Nothing matches these filters.</p>
      : <div className="table-wrap"><table className="data-table report-table">
          <thead><tr>{report.columns.map(c => <th key={c.key}>
            <Link href={qs({ sort: c.key, dir: sort === c.key && dir === 'desc' ? 'asc' : 'desc' })} className={sort === c.key ? 'sort-active' : undefined}>{c.label}{sort === c.key ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}</Link>
          </th>)}</tr></thead>
          <tbody>{report.rows.map(r => {
            const href = linkRow?.(r) ?? null
            return <tr key={String(r.id)}>{report.columns.map((c, i) => <td key={c.key}>{i === 0 && href ? <Link href={href}>{r[c.key] ?? '—'}</Link> : (r[c.key] ?? '—')}</td>)}</tr>
          })}</tbody>
        </table></div>}
  </section>
}
