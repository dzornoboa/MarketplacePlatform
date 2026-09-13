import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { SubmitButton } from '@/components/submit-button'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { requestIntroduction } from './actions'

export const dynamic = 'force-dynamic'

const STAGE_HELP: Record<string, string> = {
  requested: 'WTC Accra is reviewing the request before making contact.',
  approved: 'Approved by the trade desk. An introduction is being arranged.',
  introduced: 'Both parties have been introduced by WTC Accra.',
  meeting_scheduled: 'A meeting has been scheduled.',
  completed: 'The introduction is complete.',
  declined: 'The trade desk did not proceed with this introduction.',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function IntroductionsPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const preselect = typeof params.opportunity === 'string' ? params.opportunity : ''

  const { data: introductions } = await supabase.from('introductions').select('*').order('created_at', { ascending: false })
  const oppIds = [...new Set((introductions ?? []).map(i => i.opportunity_id))]
  const { data: opportunities } = oppIds.length
    ? await supabase.from('opportunities').select('id,title,sector,country').in('id', oppIds)
    : { data: [] }
  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))
  // Listings this member can ask about: published, not their own (RLS hides them without marketplace access).
  const { data: candidates } = await supabase.from('opportunities').select('id,title,sector,country').eq('status', 'published').neq('owner_user_id', profile.id).order('published_at', { ascending: false }).limit(100)
  const peopleIds = [...new Set((introductions ?? []).flatMap(i => [i.requester_id, i.recipient_id]))].filter(id => id !== profile.id)
  const { data: people } = peopleIds.length ? await supabase.from('profiles').select('id,full_name').in('id', peopleIds) : { data: [] }
  const nameById = new Map((people ?? []).map(x => [x.id, x.full_name]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal flow</p>
      <h1>Introductions</h1>
      <p className="muted">WTC Accra brokers introductions between verified counterparties. The trade desk reviews each request before either side is contacted.</p>
    </div>

    <RealtimeRefresh tables={["introductions"]} />
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card">
      <h2>Request an introduction</h2>
      {(candidates ?? []).length === 0
        ? <p className="muted">Introductions are requested from live listings. Subscribe to browse listings, then ask for an introduction here.</p>
        : <form action={requestIntroduction} className="form-stack">
            <label>Listing
              <select name="opportunityId" defaultValue={preselect} required>
                <option value="" disabled>Choose a listing</option>
                {(candidates ?? []).map(o => <option key={o.id} value={o.id}>{o.title} · {o.sector} · {o.country}</option>)}
              </select>
            </label>
            <label>Why you want to be introduced<textarea name="note" rows={3} maxLength={2000} placeholder="Who you are, what you can offer, and what you would like to discuss." /></label>
            <div><SubmitButton pendingLabel="Sending…">Request introduction</SubmitButton></div>
          </form>}
    </section>

    {(introductions ?? []).length === 0
      ? <section className="card empty-state">
          <BrandCircle />
          <h2>No introductions yet</h2>
          <p>Request an introduction from an opportunity you are interested in, and the WTC Accra trade desk will take it from there.</p>
        </section>
      : <div className="opportunity-list">{(introductions ?? []).map(item => {
          const opportunity = oppById.get(item.opportunity_id)
          const outbound = item.requester_id === profile.id
          return <article className="card opportunity-card" key={item.id}>
            <div className="opportunity-head">
              <div>
                <span className={`status-dot status-intro-${item.status}`}>{humanize(item.status)}</span>
                <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                <p className="muted">{outbound ? `You asked to be introduced to ${nameById.get(item.recipient_id) ?? 'the listing owner'}` : `${nameById.get(item.requester_id) ?? 'A member'} asked to be introduced to you`} · {dateTime(item.created_at)}</p>
              </div>
            </div>
            {opportunity && <p className="muted">{opportunity.sector} · {opportunity.country}</p>}
            {item.request_note && <p>{item.request_note}</p>}
            <p className="field-help">{STAGE_HELP[item.status] ?? ''}</p>
            {item.staff_note && <p className="field-help">Trade desk note: {item.staff_note}</p>}
            {item.meeting_at && <dl className="detail-grid detail-grid-two">
              <div><dt>Meeting</dt><dd>{dateTime(item.meeting_at)}</dd></div>
              {item.meeting_url && <div><dt>Joining link</dt><dd><a className="arrow-link" href={item.meeting_url} rel="noopener noreferrer" target="_blank">Open meeting →</a></dd></div>}
            </dl>}
          </article>
        })}</div>}
  </div>
}
