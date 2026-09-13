import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize, labelForParticipantType, selectableParticipantTypes, participantTypeLabels } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { requestConnection, respondToConnection, toggleFollow } from '../feed/actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function NetworkPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const error = str('error') || null
  const message = str('message') || null
  const verified = profile.verification_status === 'verified'

  if (!verified) {
    return <div className="page-stack narrow-content">
      <div><p className="eyebrow">Your network</p><h1>Network</h1></div>
      <section className="restriction-banner">
        <div>
          <strong>Verification required</strong>
          <p>Until WTC Accra verifies your account you cannot browse members, connect, or follow. This is what keeps the network credible on both sides.</p>
        </div>
        <Link className="button button-light" href="/dashboard/verification">Continue verification</Link>
      </section>
    </div>
  }

  const search = str('q'), participant = str('participant'), memberCountry = str('country')

  const [{ data: directory }, { data: connections }] = await Promise.all([
    supabase.rpc('member_directory', {
      search: search || null,
      participant: participant || null,
      member_country: memberCountry || null,
      only_ids: null,
      max_rows: 60,
    }),
    supabase.from('connections').select('*').order('created_at', { ascending: false }),
  ])

  const counterpartIds = [...new Set((connections ?? []).flatMap(c => [c.requester_id, c.addressee_id]))]
    .filter(id => id !== profile.id)
  const { data: counterparts } = counterpartIds.length
    ? await supabase.rpc('listing_owner_cards', { owner_ids: counterpartIds })
    : { data: [] }
  const personById = new Map((counterparts ?? []).map(p => [p.id, p]))

  const incoming = (connections ?? []).filter(c => c.addressee_id === profile.id && c.status === 'pending')
  const outgoing = (connections ?? []).filter(c => c.requester_id === profile.id && c.status === 'pending')
  const accepted = (connections ?? []).filter(c => c.status === 'accepted')

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Your network</p>
      <h1>Network</h1>
      <p className="muted">Connect with verified investors, buyers, businesses and project sponsors. Every request is copied to WTC Accra with the deal and the process attached.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {incoming.length > 0 && <section>
      <h2>Requests for you ({incoming.length})</h2>
      <div className="opportunity-list">{incoming.map(item => {
        const person = personById.get(item.requester_id)
        return <article className="card opportunity-card" key={item.id}>
          <div className="opportunity-head">
            <div>
              <span className={`status-dot status-conn-${item.status}`}>{humanize(item.intent)} request</span>
              <h3>{person?.full_name ?? 'A member'}</h3>
              <p className="muted">{person ? `${labelForParticipantType(person.participant_type)}${person.organisation ? ` · ${person.organisation}` : ''} · ` : ''}{dateTime(item.created_at)}</p>
            </div>
          </div>
          {item.message && <p>{item.message}</p>}
          <form action={respondToConnection} className="review-form">
            <input type="hidden" name="connectionId" value={item.id} />
            <label>Reply (optional)</label>
            <textarea name="responseNote" rows={2} />
            <div className="button-row">
              <button className="button button-primary" name="decision" value="accept">Accept</button>
              <button className="button button-danger" name="decision" value="decline">Decline</button>
            </div>
          </form>
        </article>
      })}</div>
    </section>}

    <section className="split-grid">
      <div className="card">
        <h2>Connected ({accepted.length})</h2>
        {accepted.length === 0
          ? <p className="muted">No accepted connections yet.</p>
          : <div className="history-list">{accepted.map(item => {
              const otherId = item.requester_id === profile.id ? item.addressee_id : item.requester_id
              const person = personById.get(otherId)
              return <div key={item.id}>
                <strong>{person?.full_name ?? 'Member'}</strong>
                <span>{humanize(item.intent)}</span>
                <p className="muted">{person ? labelForParticipantType(person.participant_type) : ''} · connected {dateTime(item.responded_at ?? item.created_at)}</p>
              </div>
            })}</div>}
      </div>
      <div className="card">
        <h2>Awaiting a reply ({outgoing.length})</h2>
        {outgoing.length === 0
          ? <p className="muted">No pending requests.</p>
          : <div className="history-list">{outgoing.map(item => {
              const person = personById.get(item.addressee_id)
              return <div key={item.id}>
                <strong>{person?.full_name ?? 'Member'}</strong>
                <span>{humanize(item.intent)}</span>
                <form action={respondToConnection}>
                  <input type="hidden" name="connectionId" value={item.id} />
                  <button className="link-button link-button-danger" name="decision" value="withdraw">Withdraw request</button>
                </form>
              </div>
            })}</div>}
      </div>
    </section>

    <section>
      <h2>Member directory</h2>
      <p className="muted">Verified members only. Contact details stay private until a connection is accepted.</p>
      <form className="filter-row card" method="get">
        <label>Name<input name="q" defaultValue={search} placeholder="Search members" /></label>
        <label>Participant type
          <select name="participant" defaultValue={participant}>
            <option value="">All types</option>
            {selectableParticipantTypes.map(t => <option key={t} value={t}>{participantTypeLabels[t]}</option>)}
          </select>
        </label>
        <label>Country<input name="country" defaultValue={memberCountry} placeholder="Ghana" /></label>
        <button className="button button-outline" type="submit">Search</button>
      </form>

      {(directory ?? []).length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>No members match</h2><p>Widen your search, or check back as WTC Accra verifies more participants.</p></section>
        : <div className="member-grid">{(directory ?? []).map(person => <article className="card member-card" key={person.id}>
            <div className="member-identity">
              <span className="member-avatar" aria-hidden="true">{(person.full_name || '?').charAt(0)}</span>
              <div>
                <strong>{person.full_name}</strong>{person.is_staff && <span className="status-dot status-verified">WTC Accra staff</span>}
                <span className="member-role">{labelForParticipantType(person.participant_type)}</span>
              </div>
            </div>
            <p className="muted">{[person.job_title, person.organisation].filter(Boolean).join(' · ') || 'WTC Accra member'}</p>
            <p className="field-help">{[person.city, person.country].filter(Boolean).join(', ') || 'Location not set'}</p>

            {person.connection_status === 'accepted'
              ? <span className="status-dot status-verified">Connected</span>
              : person.connection_status === 'pending'
                ? <span className="status-dot">Request pending</span>
                : <details className="eoi-block connect-block">
                    <summary>Connect</summary>
                    <form action={requestConnection} className="form-stack">
                      <input type="hidden" name="addressee" value={person.id} />
                      <input type="hidden" name="returnTo" value="/dashboard/network" />
                      <label>Request type
                        <select name="intent" defaultValue="connect">
                          <option value="connect">Just connect</option>
                          <option value="invest">I want to invest</option>
                          <option value="buy">I want to buy</option>
                          <option value="partner">I want to partner</option>
                        </select>
                      </label>
                      <label>Message<textarea name="note" rows={3} maxLength={2000} /></label>
                      <SubmitButton>Send request</SubmitButton>
                    </form>
                  </details>}

            <form action={toggleFollow}>
              <input type="hidden" name="target" value={person.id} />
              <input type="hidden" name="returnTo" value="/dashboard/network" />
              <button className={person.is_following ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">
                {person.is_following ? '✓ Following' : '+ Follow'}
              </button>
            </form>
          </article>)}</div>}
    </section>
  </div>
}
