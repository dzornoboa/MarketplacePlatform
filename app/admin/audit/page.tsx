import { requireAdminProfile } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { dateTime } from '@/lib/format'
import { humanize } from '@/lib/auth/access'
import { BrandCircle } from '@/components/brand'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminAuditPage({ searchParams }: Props) {
  const { supabase } = await requireAdminProfile()
  const params = await searchParams
  const entity = typeof params.entity === 'string' ? params.entity : ''
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const actor = typeof params.actor === 'string' ? params.actor : ''
  const since = typeof params.since === 'string' ? params.since : ''
  const sort = typeof params.sort === 'string' && ['newest', 'oldest'].includes(params.sort) ? params.sort : 'newest'

  let query = supabase.from('audit_events').select('*').order('created_at', { ascending: sort === 'oldest' }).limit(300)
  if (entity) query = query.eq('entity_type', entity)
  if (q) query = query.ilike('action', `%${q}%`)
  if (actor) query = query.eq('actor_id', actor)
  if (since) query = query.gte('created_at', new Date(since).toISOString())
  const [{ data: events }, { data: allActors }, { data: typeRows }] = await Promise.all([
    query,
    supabase.from('profiles').select('id,full_name').neq('system_role', 'user').order('full_name'),
    supabase.from('audit_events').select('entity_type').limit(3000),
  ])

  const actorIds = [...new Set((events ?? []).map(e => e.actor_id).filter((id): id is string => !!id))]
  const { data: actors } = actorIds.length
    ? await supabase.from('profiles').select('id,full_name').in('id', actorIds)
    : { data: [] }
  const actorById = new Map((actors ?? []).map(a => [a.id, a.full_name]))
  const entityTypes = [...new Set((typeRows ?? []).map(e => e.entity_type))].sort()

  return <div className="page-stack">
    <RealtimeRefresh tables={["audit_events"]} />
    <div>
      <p className="eyebrow">Governance</p>
      <h1>Audit log</h1>
      <p className="muted">Every verification decision, access change, role change and review is recorded here with the acting administrator.</p>
    </div>

    <form className="filter-row card" method="get">
      <label>Action<input name="q" defaultValue={q} placeholder="e.g. verification, payment" /></label>
      <label>Entity
        <select name="entity" defaultValue={entity}>
          <option value="">All entities</option>
          {entityTypes.map(t => <option key={t} value={t}>{humanize(t)}</option>)}
        </select>
      </label>
      <label>Actor<select name="actor" defaultValue={actor}><option value="">Anyone</option>{(allActors ?? []).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select></label>
      <label>Since<input type="date" name="since" defaultValue={since} /></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

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
