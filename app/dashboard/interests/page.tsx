import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { respondToInterest } from '../opportunities/actions'

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

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal flow</p>
      <h1>Expressions of interest</h1>
      <p className="muted">Interest you have sent to other members, and interest received on your own listings.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section>
      <h2>Received</h2>
      {received.length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>No interest received yet</h2><p>When a subscribed member expresses interest in one of your listings it appears here.</p></section>
        : <div className="opportunity-list">{received.map(item => {
            const opportunity = byId.get(item.opportunity_id)
            return <article className="card opportunity-card" key={item.id}>
              <div className="opportunity-head">
                <div>
                  <span className={`status-dot status-eoi-${item.status}`}>{humanize(item.status)}</span>
                  <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                  <p className="muted">Received {dateTime(item.created_at)}</p>
                </div>
              </div>
              <p>{item.message}</p>
              {item.owner_note && <p className="field-help">Your note: {item.owner_note}</p>}
              {item.status !== 'accepted' && item.status !== 'declined' && <form action={respondToInterest} className="review-form">
                <input type="hidden" name="eoiId" value={item.id} />
                <label>Note to the applicant</label>
                <textarea name="ownerNote" rows={2} />
                <div className="button-row">
                  <button className="button button-primary" name="decision" value="accept">Accept</button>
                  <button className="button button-secondary" name="decision" value="review">Mark under review</button>
                  <button className="button button-danger" name="decision" value="decline">Decline</button>
                </div>
              </form>}
            </article>
          })}</div>}
    </section>

    <section>
      <h2>Sent</h2>
      {sent.length === 0
        ? <p className="muted">You have not expressed interest in any opportunity yet.</p>
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
              {item.owner_note && <p className="field-help">Owner response: {item.owner_note}</p>}
            </article>
          })}</div>}
    </section>
  </div>
}
