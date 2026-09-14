import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { Avatar } from '@/components/avatar'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { respondToInterest, withdrawBid } from '../opportunities/actions'

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
  const { data: applicants } = applicantIds.length ? await supabase.rpc('listing_owner_cards', { owner_ids: applicantIds }) : { data: [] }
  const applicantById = new Map((applicants ?? []).map(a => [a.id, a]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal flow</p>
      <h1>Bids</h1>
      <p className="muted">Bids you have placed on other members' listings, and bids received on yours. Every bid passes WTC Accra due diligence before it reaches the owner, and both parties are notified at each step.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section>
      <h2>Received on your listings</h2>
      <p className="muted">Only bids WTC Accra has cleared appear here. Accepting one tells the bidder and the trade desk, who can then open a deal room.</p>
      {received.length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>No cleared bids yet</h2><p>When a member bids on one of your listings and WTC Accra clears it, it appears here for you to accept or decline.</p></section>
        : <div className="opportunity-list">{received.map(item => {
            const opportunity = byId.get(item.opportunity_id)
            return <article className="card opportunity-card" key={item.id}>
              <div className="opportunity-head">
                <div>
                  <span className={`status-dot status-eoi-${item.status}`}>{humanize(item.status)}</span>
                  <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                  {applicantById.get(item.applicant_id) && <p className="muted avatar-stack"><Avatar src={applicantById.get(item.applicant_id)?.avatar_url} name={applicantById.get(item.applicant_id)?.full_name} size={24} />{applicantById.get(item.applicant_id)?.full_name}<VerifiedCheck verified={applicantById.get(item.applicant_id)?.is_verified} size={14} />{applicantById.get(item.applicant_id)?.organisation ? ` · ${applicantById.get(item.applicant_id)?.organisation}` : ''}</p>}
                  <p className="muted">Received {dateTime(item.created_at)}</p>
                </div>
              </div>
              <p>{item.message}</p>
              {item.owner_note && <p className="field-help">Your note: {item.owner_note}</p>}
              {item.status !== 'accepted' && item.status !== 'declined' && <form action={respondToInterest} className="review-form">
                <input type="hidden" name="eoiId" value={item.id} />
                <label>Note to the bidder</label>
                <textarea name="ownerNote" rows={2} />
                <div className="button-row">
                  <button className="button button-primary" name="decision" value="accept">Accept bid</button>
                  <button className="button button-danger" name="decision" value="decline">Decline</button>
                </div>
              </form>}
            </article>
          })}</div>}
    </section>

    <section>
      <h2>Bids you placed</h2>
      {sent.length === 0
        ? <p className="muted">You have not bid on any listing yet. <a className="arrow-link" href="/opportunities">Browse live listings →</a></p>
        : <div className="opportunity-list">{sent.map(item => {
            const opportunity = byId.get(item.opportunity_id)
            return <article className="card opportunity-card" key={item.id}>
              <div className="opportunity-head">
                <div>
                  <span className={`status-dot status-eoi-${item.status}`}>{humanize(item.status)}</span>
                  <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                  <p className="muted">{opportunity ? `${opportunity.sector} · ${opportunity.country} · ` : ''}Sent {dateTime(item.created_at)}</p>
                </div>
              </div>
              <p>{item.message}</p>
              <p className="field-help">{item.status === 'submitted' ? 'With WTC Accra for due diligence.' : item.status === 'under_review' ? 'Cleared by WTC Accra — now with the owner.' : item.status === 'accepted' ? 'Accepted by the owner — a deal room is open.' : item.status === 'declined' ? 'Not proceeding.' : 'Withdrawn.'}</p>
              {item.owner_note && <p className="field-help">Note: {item.owner_note}</p>}
              <div className="button-row">
                {item.status === 'accepted' && <Link className="button button-primary" href="/dashboard/deal-rooms">Open deal room</Link>}
                {item.status === 'under_review' && <Link className="button button-outline" href={`/dashboard/introductions?opportunity=${item.opportunity_id}`}>Request an introduction</Link>}
                {(item.status === 'submitted' || item.status === 'under_review') && <form action={withdrawBid}><input type="hidden" name="eoiId" value={item.id} /><SubmitButton className="button button-danger" pendingLabel="Withdrawing…">Withdraw bid</SubmitButton></form>}
              </div>
            </article>
          })}</div>}
    </section>
  </div>
}
