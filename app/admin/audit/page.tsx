import { requireAdminProfile } from '@/lib/auth/guards'
import { dateTime } from '@/lib/format'
import { humanize } from '@/lib/auth/access'
import { BrandCircle } from '@/components/brand'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminAuditPage({ searchParams }: Props) {
  const { supabase } = await requireAdminProfile()
  const params = await searchParams
  const entity = typeof params.entity === 'string' ? params.entity : ''

  let query = supabase.from('audit_events').select('*').order('created_at', { ascending: false }).limit(200)
  if (entity) query = query.eq('entity_type', entity)
  const { data: events } = await query

  const actorIds = [...new Set((events ?? []).map(e => e.actor_id).filter((id): id is string => !!id))]
  const { data: actors } = actorIds.length
    ? await supabase.from('profiles').select('id,full_name').in('id', actorIds)
    : { data: [] }
  const actorById = new Map((actors ?? []).map(a => [a.id, a.full_name]))
  const entityTypes = [...new Set((events ?? []).map(e => e.entity_type))].sort()

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Governance</p>
      <h1>Audit log</h1>
      <p className="muted">Every verification decision, access change, role change and review is recorded here with the acting administrator.</p>
    </div>

    {entityTypes.length > 1 && <form className="filter-row card" method="get">
      <label>Entity
        <select name="entity" defaultValue={entity}>
          <option value="">All entities</option>
          {entityTypes.map(t => <option key={t} value={t}>{humanize(t)}</option>)}
        </select>
      </label>
      <button className="button button-outline" type="submit">Filter</button>
    </form>}

    {(events ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>No audit events</h2><p>Administrative actions will appear here as they happen.</p></section>
      : <section className="card table-wrap">
          <table className="data-table">
            <thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Actor</th><th>Details</th></tr></thead>
            <tbody>{(events ?? []).map(event => <tr key={event.id}>
              <td>{dateTime(event.created_at)}</td>
              <td><strong>{event.action}</strong></td>
              <td>{humanize(event.entity_type)}</td>
              <td>{event.actor_id ? actorById.get(event.actor_id) ?? 'Unknown' : 'System'}</td>
              <td><code>{JSON.stringify(event.details)}</code></td>
            </tr>)}</tbody>
          </table>
        </section>}
  </div>
}
