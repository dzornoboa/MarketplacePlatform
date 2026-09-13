import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { replyAsStaff, assignToMe } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const TABS = ['open', 'in_progress', 'resolved', 'closed'] as const

export default async function AdminSupportPage({ searchParams }: Props) {
  const { supabase, profile } = await requireCapability('support')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' && TABS.includes(params.status as 'open') ? params.status : 'open'
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const priority = typeof params.priority === 'string' ? params.priority : ''
  const sort = typeof params.sort === 'string' && ['oldest', 'newest', 'priority'].includes(params.sort) ? params.sort : 'oldest'

  let query = supabase.from('support_requests').select('*').eq('status', status as 'open').limit(200)
  if (q) query = query.ilike('subject', `%${q}%`)
  if (priority) query = query.eq('priority', priority)
  query = sort === 'priority' ? query.order('priority').order('created_at') : query.order('created_at', { ascending: sort === 'oldest' })
  const { data: requests } = await query

  const requestIds = (requests ?? []).map(r => r.id)
  const { data: messages } = requestIds.length
    ? await supabase.from('support_messages').select('*').in('support_request_id', requestIds).order('created_at')
    : { data: [] }

  const peopleIds = [...new Set([
    ...(requests ?? []).map(r => r.user_id),
    ...(messages ?? []).map(m => m.author_id),
  ])]
  const { data: people } = peopleIds.length
    ? await supabase.from('profiles').select('id,full_name,system_role,verification_status,participant_type').in('id', peopleIds)
    : { data: [] }
  const personById = new Map((people ?? []).map(p => [p.id, p]))

  const counts = await Promise.all(TABS.map(async tab => {
    const { count } = await supabase.from('support_requests').select('*', { count: 'exact', head: true }).eq('status', tab)
    return { status: tab, count: count ?? 0 }
  }))

  return <div className="page-stack">
    <RealtimeRefresh tables={["support_requests","support_messages"]} />
    <div>
      <p className="eyebrow">Support desk</p>
      <h1>Member requests</h1>
      <p className="muted">Each request carries the member&rsquo;s verification state, so you can answer without asking them to repeat it.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">
      {counts.map(tab => <a key={tab.status} className={tab.status === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/support?status=${tab.status}`}>
        {humanize(tab.status)}<span>{tab.count}</span>
      </a>)}
    </nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Subject<input name="q" defaultValue={q} placeholder="Search subjects" /></label>
      <label>Priority<select name="priority" defaultValue={priority}><option value="">All</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="oldest">Oldest first</option><option value="newest">Newest first</option><option value="priority">By priority</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {(requests ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Queue is clear</h2><p>No requests with status &ldquo;{humanize(status)}&rdquo;.</p></section>
      : <div className="review-list">{(requests ?? []).map(request => {
          const member = personById.get(request.user_id)
          const thread = (messages ?? []).filter(m => m.support_request_id === request.id)
          return <article className="card review-card" key={request.id}>
            <div className="review-head">
              <div>
                <h2>{request.subject}</h2>
                <p><Link href={`/admin/users/${request.user_id}`}>{member?.full_name ?? 'Member'}</Link> · {humanize(member?.participant_type)} · verification {humanize(member?.verification_status)}</p>
              </div>
              <div className="pill-row">
                <span className={`status-dot status-support-${request.status}`}>{humanize(request.status)}</span>
                <span className="status-dot">{humanize(request.priority)}</span>
              </div>
            </div>
            <dl className="detail-grid detail-grid-two">
              <div><dt>Category</dt><dd>{humanize(request.category)}</dd></div>
              <div><dt>Opened</dt><dd>{dateTime(request.created_at)}</dd></div>
              <div><dt>Assigned to</dt><dd>{request.assigned_to ? personById.get(request.assigned_to)?.full_name ?? 'A colleague' : 'Nobody yet'}</dd></div>
              <div><dt>Messages</dt><dd>{thread.length}</dd></div>
            </dl>

            <div className="thread">{thread.map(entry => {
              const author = personById.get(entry.author_id)
              const staff = !!author && author.system_role !== 'user'
              return <article className={staff ? 'thread-message thread-staff' : 'thread-message'} key={entry.id}>
                <header>
                  <strong>{entry.author_id === profile.id ? 'You' : author?.full_name ?? 'Member'}</strong>
                  {staff && <span className="thread-badge">WTC Accra</span>}
                  <time>{dateTime(entry.created_at)}</time>
                </header>
                <p>{entry.body}</p>
              </article>
            })}</div>

            <div className="admin-action-grid">
              <form action={replyAsStaff} className="review-form">
                <input type="hidden" name="requestId" value={request.id} />
                <label>Reply to the member</label>
                <textarea name="body" rows={3} required />
                <label>Set status
                  <select name="status" defaultValue={request.status}>
                    {TABS.map(tab => <option key={tab} value={tab}>{humanize(tab)}</option>)}
                  </select>
                </label>
                <button className="button button-primary" type="submit">Send reply</button>
              </form>
              {request.assigned_to !== profile.id && <form action={assignToMe} className="review-form">
                <input type="hidden" name="requestId" value={request.id} />
                <label>Ownership</label>
                <p className="field-help">Take this request and mark it in progress.</p>
                <button className="button button-outline" type="submit">Assign to me</button>
              </form>}
            </div>
          </article>
        })}</div>}
  </div>
}
