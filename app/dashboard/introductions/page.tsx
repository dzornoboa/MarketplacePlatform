import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'

export const dynamic = 'force-dynamic'

const STAGE_HELP: Record<string, string> = {
  requested: 'WTC Accra is reviewing the request before making contact.',
  approved: 'Approved by the trade desk. An introduction is being arranged.',
  introduced: 'Both parties have been introduced by WTC Accra.',
  meeting_scheduled: 'A meeting has been scheduled.',
  completed: 'The introduction is complete.',
  declined: 'The trade desk did not proceed with this introduction.',
}

export default async function IntroductionsPage() {
  const { supabase, profile } = await requireUserProfile()

  const { data: introductions } = await supabase.from('introductions').select('*').order('created_at', { ascending: false })
  const oppIds = [...new Set((introductions ?? []).map(i => i.opportunity_id))]
  const { data: opportunities } = oppIds.length
    ? await supabase.from('opportunities').select('id,title,sector,country').in('id', oppIds)
    : { data: [] }
  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal flow</p>
      <h1>Introductions</h1>
      <p className="muted">WTC Accra brokers introductions between verified counterparties. The trade desk reviews each request before either side is contacted.</p>
    </div>

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
                <p className="muted">{outbound ? 'You requested this introduction' : 'Requested with you'} · {dateTime(item.created_at)}</p>
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
