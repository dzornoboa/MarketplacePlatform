import { requireCapability } from '@/lib/auth/guards'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { SubmitButton } from '@/components/submit-button'
import { BrandCircle } from '@/components/brand'
import { createStaffMatch, updateStaffMatch, removeStaffMatch } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminMatchingPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('matching')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const [{ data: matches }, { data: members }, { data: opportunities }] = await Promise.all([
    supabase.from('matches').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('profiles').select('id,full_name,participant_type,country,system_role').eq('account_status', 'active').order('full_name').limit(500),
    supabase.from('opportunities').select('id,title,sector,country,status').eq('status', 'published').order('published_at', { ascending: false }).limit(500),
  ])

  const memberById = new Map((members ?? []).map(member => [member.id, member]))
  const opportunityById = new Map((opportunities ?? []).map(item => [item.id, item]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Trade Officer</p>
      <h1>Matching</h1>
      <p className="muted">Review automated matches and add curated WTC Accra matches between members and published opportunities. Members see these in their Matches workspace.</p>
    </div>

    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card form-stack">
      <h2>Create Or Update A Match</h2>
      <div className="form-grid">
        <label>Member
          <select name="userId" form="new-match" required defaultValue="">
            <option value="" disabled>Select Member</option>
            {(members ?? []).filter(member => member.system_role === 'user').map(member => <option key={member.id} value={member.id}>{member.full_name} · {labelForParticipantType(member.participant_type)} · {member.country ?? 'No Country'}</option>)}
          </select>
        </label>
        <label>Published Opportunity
          <select name="opportunityId" form="new-match" required defaultValue="">
            <option value="" disabled>Select Opportunity</option>
            {(opportunities ?? []).map(item => <option key={item.id} value={item.id}>{item.title} · {item.country}</option>)}
          </select>
        </label>
      </div>
      <form id="new-match" action={createStaffMatch} className="form-stack">
        <div className="form-grid">
          <label>Match Score<input name="score" type="number" min={0} max={100} defaultValue={75} required /></label>
          <label>Rationale<input name="rationale" maxLength={1000} placeholder="Why this member and opportunity are a strong fit" /></label>
        </div>
        <SubmitButton pendingLabel="Saving…">Save Match</SubmitButton>
      </form>
    </section>

    {(matches ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>No Matches Yet</h2><p>Automated and trade-desk matches will appear here.</p></section>
      : <div className="article-grid">{(matches ?? []).map(match => {
          const member = memberById.get(match.user_id)
          const opportunity = opportunityById.get(match.opportunity_id)
          return <article className="card article-card" key={match.id}>
            <span className={`status-dot status-match-${match.status}`}>{humanize(match.status)}</span>
            <h3>{opportunity?.title ?? 'Opportunity'}</h3>
            <p className="muted">{member?.full_name ?? 'Member'} · {member ? labelForParticipantType(member.participant_type) : 'Member'}{member?.country ? ` · ${member.country}` : ''}</p>
            <p className="field-help">Score {match.score}/100 · Added {dateTime(match.created_at)}</p>
            <form action={updateStaffMatch} className="form-stack">
              <input type="hidden" name="matchId" value={match.id} />
              <label>Score<input name="score" type="number" min={0} max={100} defaultValue={match.score} required /></label>
              <label>Rationale<textarea name="rationale" rows={3} defaultValue={match.rationale ?? ''} /></label>
              <SubmitButton className="button button-outline" pendingLabel="Saving…">Update Match</SubmitButton>
            </form>
            <form action={removeStaffMatch}>
              <input type="hidden" name="matchId" value={match.id} />
              <button className="button button-danger" type="submit">Remove Match</button>
            </form>
          </article>
        })}</div>}
  </div>
}
