import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { Avatar } from '@/components/avatar'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { respondToInterest, withdrawDeal } from '../opportunities/actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function InterestsPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  // RLS returns both sides of the conversation: what I sent and what I received.
  const { data: interests } = await supabase.from('expressions_of_interest').select('*').order('created_at', { ascending: false })
  const ids = [...new Set((interests ?? []).map(i => i.opportunity_id))]
  const { data: opportunities } = ids.length
    ? await supabase.from('opportunities').select('id,title,owner_user_id,sector,country').in('id', ids)
    : { data: [] }
  const byId = new Map((opportunities ?? []).map(o => [o.id, o]))

  const sent = (interests ?? []).filter(i => i.applicant_id === profile.id)
  const received = (interests ?? []).filter(i => i.applicant_id !== profile.id)
  const applicantIds = [...new Set(received.map(i => i.applicant_id))]
  const actionIds = [...new Set((interests ?? []).map(i => i.last_action_by).filter((id): id is string => !!id))]
  const [{ data: applicants }, { data: actors }] = await Promise.all([
    applicantIds.length ? supabase.rpc('listing_owner_cards', { owner_ids: applicantIds }) : Promise.resolve({ data: [] }),
    actionIds.length ? supabase.from('profiles').select('id,full_name,system_role').in('id', actionIds) : Promise.resolve({ data: [] }),
  ])
  const applicantById = new Map((applicants ?? []).map(a => [a.id, a]))
  const actorById = new Map((actors ?? []).map(a => [a.id, a]))
  const statusLabel = (status: string) => status === 'submitted' ? 'Processing' : status === 'under_review' ? 'Processed' : status === 'accepted' ? 'Connected' : status === 'declined' ? 'Declined' : 'Withdrawn'

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal flow</p>
      <h1>Deals</h1>
      <p className="muted">Deal requests you sent and received. Every request is monitored by WTC Accra and can move through Processing, Processed, Connected, Declined or Withdrawn.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section>
      <h2>Received on your listings</h2>
      <p className="muted">Only processed deal requests appear here. Accepting a request marks it Connected and automatically opens a monitored Deal Room for the parties and authorised WTC Accra staff.</p>
      {received.length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>No cleared deals yet</h2><p>When a member sends a deal request and WTC Accra processes it, it appears here for you to accept or decline.</p></section>
        : <div className="opportunity-list">{received.map(item => {
            const opportunity = byId.get(item.opportunity_id)
            return <article className="card opportunity-card" key={item.id}>
              <div className="opportunity-head">
                <div>
                  <span className={`status-dot status-eoi-${item.status}`}>{statusLabel(item.status)}</span>
                  <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                  {applicantById.get(item.applicant_id) && <p className="muted avatar-stack"><Avatar src={applicantById.get(item.applicant_id)?.avatar_url} name={applicantById.get(item.applicant_id)?.full_name} size={24} />{applicantById.get(item.applicant_id)?.full_name}<VerifiedCheck verified={applicantById.get(item.applicant_id)?.is_verified} size={14} />{applicantById.get(item.applicant_id)?.organisation ? ` · ${applicantById.get(item.applicant_id)?.organisation}` : ''}</p>}
                  <p className="muted">Received {dateTime(item.created_at)}</p>
                </div>
              </div>
              <p>{item.message}</p>
              {item.owner_note && <p className="field-help">Your note: {item.owner_note}</p>}
              {item.status !== 'accepted' && item.status !== 'declined' && <form action={respondToInterest} className="review-form">
                <input type="hidden" name="eoiId" value={item.id} />
                <label>Note to the participant</label>
                <textarea name="ownerNote" rows={2} />
                <div className="button-row">
                  <button className="button button-primary" name="decision" value="accept">Accept And Connect</button>
                  <button className="button button-danger" name="decision" value="decline">Decline</button>
                </div>
              </form>}
            </article>
          })}</div>}
    </section>

    <section>
      <h2>Deal Requests You Sent</h2>
      {sent.length === 0
        ? <p className="muted">You have not sent a deal request yet. <a className="arrow-link" href="/opportunities">Browse live listings →</a></p>
        : <div className="opportunity-list">{sent.map(item => {
            const opportunity = byId.get(item.opportunity_id)
            return <article className="card opportunity-card" key={item.id}>
              <div className="opportunity-head">
                <div>
                  <span className={`status-dot status-eoi-${item.status}`}>{statusLabel(item.status)}</span>
                  <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                  <p className="muted">{opportunity ? `${opportunity.sector} · ${opportunity.country} · ` : ''}Sent {dateTime(item.created_at)}</p>
                </div>
              </div>
              <p>{item.message}</p>
              <p className="field-help">{item.status === 'submitted' ? 'Processing — WTC Accra is reviewing your request.' : item.status === 'under_review' ? 'Processed — now with the opportunity owner.' : item.status === 'accepted' ? 'Connected — your monitored Deal Room is open.' : item.status === 'declined' ? 'Not proceeding.' : 'Withdrawn.'}</p>
              {item.owner_note && <p className="field-help">Note: {item.owner_note}</p>}
              {item.last_action_by && actorById.get(item.last_action_by) && <p className="field-help">Last Updated By <strong>{actorById.get(item.last_action_by)?.full_name}</strong> · {humanize(item.last_action_role || actorById.get(item.last_action_by)?.system_role)}{item.last_action_at ? ` · ${dateTime(item.last_action_at)}` : ''}</p>}
              <div className="button-row">
                {item.status === 'accepted' && <Link className="button button-primary" href="/dashboard/deal-rooms">Open deal room</Link>}
                {item.status === 'under_review' && <Link className="button button-outline" href={`/dashboard/introductions?opportunity=${item.opportunity_id}`}>Request Match Access</Link>}
                {(item.status === 'submitted' || item.status === 'under_review') && <form action={withdrawDeal}><input type="hidden" name="eoiId" value={item.id} /><SubmitButton className="button button-danger" pendingLabel="Withdrawing…">Withdraw Deal Request</SubmitButton></form>}
              </div>
            </article>
          })}</div>}
    </section>
  </div>
}
