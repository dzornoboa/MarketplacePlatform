import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { SubmitButton } from '@/components/submit-button'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { requestIntroduction, withdrawIntroduction } from './actions'

export const dynamic = 'force-dynamic'

const STAGE_HELP: Record<string, string> = {
  requested: 'Processing — WTC Accra is reviewing the access request before any direct connection opens.',
  approved: 'Processed — WTC Accra approved the request and the monitored Deal Room is available.',
  introduced: 'Connected — the approved counterparties can continue inside the monitored Deal Room.',
  meeting_scheduled: 'Meeting Scheduled — meeting details have been added by WTC Accra.',
  completed: 'Deal Verified — WTC Accra marked the monitored workflow complete.',
  declined: 'Declined — WTC Accra did not proceed with this access request.',
  withdrawn: 'Withdrawn — you cancelled this access request before connection.',
}
const STAGE_LABEL: Record<string, string> = {
  requested: 'Processing',
  approved: 'Processed',
  introduced: 'Connected',
  meeting_scheduled: 'Meeting Scheduled',
  completed: 'Deal Verified',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
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
  // Match-access requests must also work for investors whose deal details are intentionally hidden.
  const { data: teaserRows } = await supabase.rpc('public_listing_teasers', { max_rows: 100 })
  const candidates = (teaserRows ?? []).filter(row => row.id && !row.title_hidden)
  const peopleIds = [...new Set((introductions ?? []).flatMap(i => [i.requester_id, i.recipient_id]))].filter(id => id !== profile.id)
  const actionIds = [...new Set((introductions ?? []).map(i => i.last_action_by).filter((id): id is string => !!id))]
  const [{ data: people }, { data: actors }] = await Promise.all([
    peopleIds.length ? supabase.from('profiles').select('id,full_name').in('id', peopleIds) : Promise.resolve({ data: [] }),
    actionIds.length ? supabase.from('profiles').select('id,full_name,system_role').in('id', actionIds) : Promise.resolve({ data: [] }),
  ])
  const nameById = new Map((people ?? []).map(x => [x.id, x.full_name]))
  const actorById = new Map((actors ?? []).map(x => [x.id, x]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal flow</p>
      <h1>Match Access Requests</h1>
      <p className="muted">Matched users do not connect directly. Send an access request, track its status here, and continue in a monitored Deal Room only after WTC Accra approves the connection.</p>
    </div>

    <RealtimeRefresh tables={["introductions"]} />
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card">
      <h2>Request Match Access</h2>
      {(candidates ?? []).length === 0
        ? <p className="muted">No eligible live deal teasers are available right now.</p>
        : <form action={requestIntroduction} className="form-stack">
            <label>Listing
              <select name="opportunityId" defaultValue={preselect} required>
                <option value="" disabled>Choose A Deal</option>
                {(candidates ?? []).map(o => <option key={o.id} value={o.id}>{o.title} · {o.sector} · {o.country}</option>)}
              </select>
            </label>
            <label>Why You Want Access<textarea name="note" rows={3} maxLength={2000} placeholder="Who you are, what you can offer, and what you would like to discuss." /></label>
            <div><SubmitButton pendingLabel="Sending…">Request Access</SubmitButton></div>
          </form>}
    </section>

    {(introductions ?? []).length === 0
      ? <section className="card empty-state">
          <BrandCircle />
          <h2>No Access Requests Yet</h2>
          <p>Request access from a matched deal or live deal teaser and WTC Accra will manage the connection.</p>
        </section>
      : <div className="opportunity-list">{(introductions ?? []).map(item => {
          const opportunity = oppById.get(item.opportunity_id)
          const outbound = item.requester_id === profile.id
          return <article className="card opportunity-card" key={item.id}>
            <div className="opportunity-head">
              <div>
                <span className={`status-dot status-intro-${item.status}`}>{STAGE_LABEL[item.status] ?? humanize(item.status)}</span>
                <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                <p className="muted">{outbound ? `You Requested Access To ${nameById.get(item.recipient_id) ?? 'the listing owner'}` : `${nameById.get(item.requester_id) ?? 'A member'} Requested Access To Your Deal`} · {dateTime(item.created_at)}</p>
              </div>
            </div>
            {opportunity && <p className="muted">{opportunity.sector} · {opportunity.country}</p>}
            {item.request_note && <p>{item.request_note}</p>}
            <p className="field-help">{STAGE_HELP[item.status] ?? ''}</p>
            {item.staff_note && <p className="field-help">WTC Accra Note: {item.staff_note}</p>}
            {item.last_action_by && actorById.get(item.last_action_by) && <p className="field-help">Last Updated By <strong>{actorById.get(item.last_action_by)?.full_name}</strong> · {humanize(item.last_action_role || actorById.get(item.last_action_by)?.system_role)}{item.last_action_at ? ` · ${dateTime(item.last_action_at)}` : ''}</p>}
            {outbound && (item.status === 'requested' || item.status === 'approved') && <form action={withdrawIntroduction}>
              <input type="hidden" name="introductionId" value={item.id} />
              <SubmitButton className="button button-outline" pendingLabel="Withdrawing…">Withdraw Access Request</SubmitButton>
            </form>}
            {item.meeting_at && <dl className="detail-grid detail-grid-two">
              <div><dt>Meeting</dt><dd>{dateTime(item.meeting_at)}</dd></div>
              {item.meeting_url && <div><dt>Joining link</dt><dd><a className="arrow-link" href={item.meeting_url} rel="noopener noreferrer" target="_blank">Open meeting →</a></dd></div>}
            </dl>}
          </article>
        })}</div>}
  </div>
}
