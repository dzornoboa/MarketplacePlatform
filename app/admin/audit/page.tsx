import Link from 'next/link'
import { requireAdminProfile } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { auditAction, auditActor, auditDetails, auditExportLimit, auditFilters, auditLabel, auditPageSize, readAuditActors, readAuditEvents } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

const auditTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminAuditPage({ searchParams }: Props) {
  const { supabase } = await requireAdminProfile()
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') params.set(key, value)
  }
  const filters = auditFilters(params)
  const { q, entity, actor, since, sort } = filters
  const filterParams = new URLSearchParams(Object.entries(filters).filter(([key, value]) => value && (key !== 'sort' || value !== 'newest')))
  const pageNumber = Number(params.get('page') ?? '1')
  const page = Number.isSafeInteger(pageNumber) && pageNumber > 0 && pageNumber <= 100_000 ? pageNumber : 1
  const offset = (page - 1) * auditPageSize
  const pageLink = (number: number) => {
    const query = new URLSearchParams(filterParams)
    if (number > 1) query.set('page', String(number))
    return `/admin/audit?${query}`
  }

  const [{ data: result, error: eventsError }, { data: allActors, error: allActorsError }, { data: typeRows, error: typeRowsError }] = await Promise.all([
    readAuditEvents(supabase, filters, offset, auditPageSize + 1),
    supabase.from('profiles').select('id,full_name').neq('system_role', 'user').order('full_name'),
    supabase.from('audit_events').select('entity_type').limit(3000),
  ])
  const events = (result ?? []).slice(0, auditPageSize)
  const { data: actors, error: actorsError } = await readAuditActors(supabase, events)
  const actorById = new Map((actors ?? []).map(entry => [entry.id, entry.full_name]))
  const entityTypes = [...new Set((typeRows ?? []).map(event => event.entity_type))].sort()

  return <div className="page-stack audit-log" lang="en" translate="no" data-no-translate>
    <RealtimeRefresh tables={['audit_events']} />
    <header className="audit-header">
      <div>
        <h1>Audit log</h1>
        <p className="muted">Review changes to accounts, access and marketplace activity.</p>
      </div>
      <a className="button button-outline" href={`/api/admin/audit/export?${filterParams}`} title={`Download up to ${auditExportLimit.toLocaleString('en-GB')} matching events`}>Export to Excel</a>
    </header>

    {(allActorsError || typeRowsError || actorsError) && <p className="alert alert-error" role="alert">Some filters or actor names could not be loaded.</p>}

    <form className="filter-row card audit-filters" method="get">
      <label>Action<input name="q" defaultValue={q} placeholder="e.g. connection requested" /></label>
      <label>Entity<select name="entity" defaultValue={entity}>
        <option value="">All entities</option>
        {entity && !entityTypes.includes(entity) && <option value={entity}>{auditLabel(entity)}</option>}
        {entityTypes.map(type => <option key={type} value={type}>{auditLabel(type)}</option>)}
      </select></label>
      <label>Actor<select name="actor" defaultValue={actor}>
        <option value="">Anyone</option>
        {actor && !(allActors ?? []).some(entry => entry.id === actor) && <option value={actor}>{actorById.get(actor) ?? 'Selected actor'}</option>}
        {(allActors ?? []).map(entry => <option key={entry.id} value={entry.id}>{entry.full_name || 'Unnamed actor'}</option>)}
      </select></label>
      <label>Since (UTC)<input type="date" name="since" defaultValue={since} /></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
      {filterParams.size > 0 && <Link className="arrow-link" href="/admin/audit">Clear filters</Link>}
    </form>

    {eventsError
      ? <p className="alert alert-error" role="alert">Could not load audit events. Refresh the page to try again.</p>
      : events.length === 0
      ? <section className="card audit-empty"><h2>No matching audit events</h2><p className="muted">Try changing the filters.</p></section>
      : <section className="card table-wrap audit-table-wrap">
          <table className="data-table audit-table">
            <thead><tr><th scope="col">Time (UTC)</th><th scope="col">Action</th><th scope="col">Entity</th><th scope="col">Actor</th><th scope="col">Details</th></tr></thead>
            <tbody>{events.map(event => {
              const details = auditDetails(event.details)
              return <tr key={event.id}>
                <td><time dateTime={event.created_at}>{auditTime.format(new Date(event.created_at))}</time></td>
                <td><strong>{auditAction(event.action)}</strong></td>
                <td>{auditLabel(event.entity_type)}</td>
                <td>{auditActor(event, actorById)}</td>
                <td>{details.length ? <>
                  <dl className="audit-details">{details.slice(0, 2).map(([key, value], index) => <div key={index}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
                  {details.length > 2 && <details><summary>Show {details.length - 2} more</summary>
                    <dl className="audit-details">{details.slice(2).map(([key, value], index) => <div key={index}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
                  </details>}
                </> : <span className="muted">—</span>}</td>
              </tr>
            })}</tbody>
          </table>
        </section>}
    {!eventsError && (page > 1 || (result?.length ?? 0) > auditPageSize) && <nav className="audit-pagination" aria-label="Audit log pages">
      {page > 1 && <Link className="button button-outline" href={pageLink(page - 1)}>Previous</Link>}
      <span className="muted">{events.length ? `Events ${offset + 1}–${offset + events.length}` : `Page ${page}`}</span>
      {(result?.length ?? 0) > auditPageSize && <Link className="button button-outline" href={pageLink(page + 1)}>Next</Link>}
    </nav>}
  </div>
}
