import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { money, date } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { updateMatchStatus } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function MatchesPage({ searchParams }: Props) {
  const { supabase } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const { data: matches } = await supabase.from('matches').select('*').order('score', { ascending: false })
  const oppIds = [...new Set((matches ?? []).map(m => m.opportunity_id))]
  const { data: opportunities } = oppIds.length
    ? await supabase.from('opportunities').select('*').in('id', oppIds)
    : { data: [] }
  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))
  const live = (matches ?? []).filter(m => m.status !== 'dismissed')
  const dismissed = (matches ?? []).filter(m => m.status === 'dismissed')

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Curated for you</p>
      <h1>Matches</h1>
      <p className="muted">Opportunities the WTC Accra trade desk has matched to your mandate or requirements. These are chosen by people, not an algorithm.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {live.length === 0
      ? <section className="card empty-state">
          <BrandCircle />
          <h2>No matches yet</h2>
          <p>Add an investment mandate or buying requirement so the trade desk knows what to look for.</p>
          <a className="button button-primary" href="/dashboard/mandate">Set your mandate</a>
        </section>
      : <div className="opportunity-list">{live.map(match => {
          const opportunity = oppById.get(match.opportunity_id)
          return <article className="card opportunity-card" key={match.id}>
            <div className="opportunity-head">
              <div>
                <span className={`status-dot status-match-${match.status}`}>{humanize(match.status)}</span>
                <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                {opportunity && <p className="muted">{opportunity.sector} · {opportunity.city ? `${opportunity.city}, ` : ''}{opportunity.country} · {humanize(opportunity.kind)}</p>}
              </div>
              <div className="opportunity-figures">
                <strong>{match.score}<small>/100</small></strong>
                <span>Match score</span>
              </div>
            </div>
            {opportunity?.summary && <p>{opportunity.summary}</p>}
            {match.rationale && <p className="field-help">Why this was matched: {match.rationale}</p>}
            {opportunity && <dl className="detail-grid detail-grid-two">
              <div><dt>Capital required</dt><dd>{money(opportunity.capital_required, opportunity.currency)}</dd></div>
              <div><dt>Deadline</dt><dd>{date(opportunity.deadline)}</dd></div>
            </dl>}
            <form action={updateMatchStatus} className="button-row">
              <input type="hidden" name="matchId" value={match.id} />
              {match.status !== 'shortlisted' && <button className="button button-primary" name="status" value="shortlisted">Shortlist</button>}
              <button className="button button-outline" name="status" value="contacted">Mark contacted</button>
              <button className="button button-danger" name="status" value="dismissed">Dismiss</button>
            </form>
          </article>
        })}</div>}

    {dismissed.length > 0 && <section className="card">
      <h2>Dismissed ({dismissed.length})</h2>
      <div className="history-list">{dismissed.map(match => <div key={match.id}>
        <strong>{oppById.get(match.opportunity_id)?.title ?? 'Opportunity'}</strong>
        <span>Score {match.score}</span>
      </div>)}</div>
    </section>}
  </div>
}
