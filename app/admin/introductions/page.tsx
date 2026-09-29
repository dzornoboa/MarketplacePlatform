import Link from 'next/link'
import { requireAnyCapability } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { SubmitButton } from '@/components/submit-button'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { reviewIntroduction } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
const TABS = ['requested', 'approved', 'introduced', 'meeting_scheduled', 'completed', 'declined'] as const

/* The trade desk brokers introductions: approve, introduce both sides,
   schedule the meeting, mark complete or decline. */
export default async function AdminIntroductionsPage({ searchParams }: Props) {
  const { supabase } = await requireAnyCapability(['introductions', 'verification'])
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const error = str('error') || null, message = str('message') || null
  const status = TABS.includes(str('status') as 'requested') ? str('status') : 'requested'
  const q = str('q').trim()
  const sort = str('sort') === 'newest' ? 'newest' : 'oldest'

  const [{ data: rows }, counts] = await Promise.all([
    supabase.from('introductions').select('*').eq('status', status as 'requested').order('created_at', { ascending: sort === 'oldest' }).limit(200),
    Promise.all(TABS.map(async t => ({ t, n: (await supabase.from('introductions').select('*', { count: 'exact', head: true }).eq('status', t)).count ?? 0 }))),
  ])
  const oppIds = [...new Set((rows ?? []).map(r => r.opportunity_id))]
  const userIds = [...new Set((rows ?? []).flatMap(r => [r.requester_id, r.recipient_id]))]
  const actionIds = [...new Set((rows ?? []).map(r => r.last_action_by).filter((id): id is string => !!id))]
  const [{ data: opps }, { data: people }, { data: actors }] = await Promise.all([
    oppIds.length ? supabase.from('opportunities').select('id,title,sector,country').in('id', oppIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('profiles').select('id,full_name,participant_type,country').in('id', userIds) : Promise.resolve({ data: [] }),
    actionIds.length ? supabase.from('profiles').select('id,full_name,system_role').in('id', actionIds) : Promise.resolve({ data: [] }),
  ])
  const oppById = new Map((opps ?? []).map(o => [o.id, o]))
  const personById = new Map((people ?? []).map(p => [p.id, p]))
  const actorById = new Map((actors ?? []).map(p => [p.id, p]))
  const stageLabel = (value: string) => value === 'requested' ? 'Processing' : value === 'approved' ? 'Processed' : value === 'introduced' ? 'Connected' : value === 'meeting_scheduled' ? 'Meeting Scheduled' : value === 'completed' ? 'Deal Verified' : 'Declined'
  const items = (rows ?? []).filter(r => !q || [oppById.get(r.opportunity_id)?.title, personById.get(r.requester_id)?.full_name, personById.get(r.recipient_id)?.full_name].some(x => (x ?? '').toLowerCase().includes(q.toLowerCase())))

  return <div className="page-stack">
    <RealtimeRefresh tables={["introductions"]} />
    <div>
      <p className="eyebrow">Trade desk</p>
      <h1>Match And Access Requests</h1>
      <p className="muted">Matched users request access before a direct connection is opened. Trade Officers, Verification Officers, Administrators and Super Administrators share visibility of every request and authorised status change.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">{counts.map(c => <a key={c.t} className={c.t === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/introductions?status=${c.t}`}>{stageLabel(c.t)}<span>{c.n}</span></a>)}</nav>

    <form className="filter-row card" method="get">
      <input type="hidden" name="status" value={status} />
      <label>Search<input name="q" defaultValue={q} placeholder="Listing or member" /></label>
      <label>Sort<select name="sort" defaultValue={sort}><option value="oldest">Oldest first</option><option value="newest">Newest first</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {items.length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Queue is clear</h2><p>No requests with status “{stageLabel(status)}”.</p></section>
      : <div className="review-list">{items.map(item => {
          const opp = oppById.get(item.opportunity_id)
          const requester = personById.get(item.requester_id), recipient = personById.get(item.recipient_id)
          return <article className="card review-card" key={item.id}>
            <div className="review-head">
              <div>
                <h2>{opp?.title ?? 'Listing'}</h2>
                <p><Link href={`/admin/users/${item.requester_id}`}>{requester?.full_name ?? 'Member'}</Link> ({labelForParticipantType(requester?.participant_type)}) → <Link href={`/admin/users/${item.recipient_id}`}>{recipient?.full_name ?? 'Owner'}</Link> ({labelForParticipantType(recipient?.participant_type)}) · {opp?.sector} · {opp?.country}</p>
              </div>
              <span>{dateTime(item.created_at)}</span>
            </div>
            {item.request_note && <p>{item.request_note}</p>}
            {item.staff_note && <p className="field-help">WTC Accra Note: {item.staff_note}</p>}
            {item.last_action_by && actorById.get(item.last_action_by) && <p className="field-help">Last Authorised By <strong>{actorById.get(item.last_action_by)?.full_name}</strong> · {humanize(item.last_action_role || actorById.get(item.last_action_by)?.system_role)}{item.last_action_at ? ` · ${dateTime(item.last_action_at)}` : ''}</p>}
            {item.meeting_at && <p className="field-help">Meeting {dateTime(item.meeting_at)}{item.meeting_url ? ` · ${item.meeting_url}` : ''}</p>}
            {!['completed', 'declined'].includes(item.status) && <form action={reviewIntroduction} className="review-form">
              <input type="hidden" name="introductionId" value={item.id} />
              <input type="hidden" name="status" value={status} />
              <div className="form-grid">
                <label>Meeting date/time<input type="datetime-local" name="meetingAt" /></label>
                <label>Meeting link<input name="meetingUrl" placeholder="https://meet…" /></label>
              </div>
              <textarea name="note" rows={2} placeholder="Note shown to both parties" />
              <div className="button-row">
                {item.status === 'requested' && <SubmitButton name="decision" value="approve" pendingLabel="Saving…">Mark Processed</SubmitButton>}
                {['requested', 'approved'].includes(item.status) && <SubmitButton name="decision" value="introduce" className="button button-secondary" pendingLabel="Saving…">Mark Connected</SubmitButton>}
                {['approved', 'introduced', 'meeting_scheduled'].includes(item.status) && <SubmitButton name="decision" value="schedule" className="button button-outline" pendingLabel="Saving…">Schedule meeting</SubmitButton>}
                {['introduced', 'meeting_scheduled'].includes(item.status) && <SubmitButton name="decision" value="complete" className="button button-outline" pendingLabel="Saving…">Mark Deal Verified</SubmitButton>}
                <SubmitButton name="decision" value="decline" className="button button-danger" pendingLabel="Saving…">Decline</SubmitButton>
              </div>
            </form>}
          </article>
        })}</div>}
  </div>
}
