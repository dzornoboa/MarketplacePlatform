import { ConnectionStatus } from '@/components/connection-status'
import { connectionByMember } from '@/lib/connections'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { Avatar } from '@/components/avatar'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLock } from '@/lib/auth/access'
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
  const state = await readAccessState(supabase)
  const lock = state ? marketplaceLock(state) : null

  if (!lock || lock.locked) {
    return <div className="page-stack list-content">
      <div><p className="eyebrow">Your network</p><h1>Network</h1></div>
      <section className="restriction-banner">
        <div>
          <strong>Subscription required</strong>
          <p>{lock?.locked ? lock.reason : 'An active subscription is needed to browse members, connect and follow.'}</p>
        </div>
        {lock?.locked && lock.action && <Link className="button button-light" href={lock.action.href}>{lock.action.label}</Link>}
      </section>
    </div>
  }

  const search = str('q'), participant = str('participant'), memberCountry = str('country')

  const [{ data: directory }, { data: connections, error: connectionsError }] = await Promise.all([
    supabase.rpc('member_directory', {
      search: search || null,
      participant: participant || null,
      member_country: memberCountry || null,
      only_ids: null,
      max_rows: 200,
    }),
    supabase.from('connections').select('*').or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`).order('created_at', { ascending: false }),
  ])

  const counterpartIds = [...new Set((connections ?? []).flatMap(c => [c.requester_id, c.addressee_id]))]
    .filter(id => id !== profile.id)
  const { data: counterparts } = counterpartIds.length
    ? await supabase.rpc('listing_owner_cards', { owner_ids: counterpartIds })
    : { data: [] }
  const personById = new Map((counterparts ?? []).map(p => [p.id, p]))

  const incoming = (connections ?? []).filter(c => c.addressee_id === profile.id && c.status === 'pending' && c.staff_approved_at)
  const outgoing = (connections ?? []).filter(c => c.requester_id === profile.id)
  const relationship = connectionByMember(connections ?? [], profile.id)
  const accepted = [...relationship.values()].filter(c => c.status === 'accepted')

  return <div className="page-stack">
    <RealtimeRefresh tables={['connections']} channel="member-connections" />
    <div>
      <p className="eyebrow">Your network</p>
      <h1>Network</h1>
      <p className="muted">Connect with verified investors, buyers, businesses and project sponsors. General networking connects active, verified members instantly. Investment, buying, selling, partnership and deal-related requests go to WTC Accra for approval.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}
    {connectionsError && <div className="alert alert-error">Could not load connection requests. Refresh the page to try again.</div>}

    {incoming.length > 0 && <section>
      <h2>Requests for you ({incoming.length})</h2>
      <div className="opportunity-list">{incoming.map(item => {
        const person = personById.get(item.requester_id)
        return <article className="card opportunity-card" id={`request-${item.id}`} key={item.id}>
          <div className="opportunity-head">
            <div>
              <span className={`status-dot status-conn-${item.status}`}>{humanize(item.intent)} request</span>
              <h3>{person ? <Link href={`/dashboard/members/${item.requester_id}`}>{person.full_name}</Link> : 'A member'}</h3>
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

    {!connectionsError && <section className="split-grid">
      <div className="card">
        <h2>Connected ({accepted.length})</h2>
        {accepted.length === 0
          ? <p className="muted">No accepted connections yet.</p>
          : <div className="history-list">{accepted.map(item => {
              const otherId = item.requester_id === profile.id ? item.addressee_id : item.requester_id
              const person = personById.get(otherId)
              return <div key={item.id}>
                <strong>{person ? <Link href={`/dashboard/members/${otherId}`}>{person.full_name}</Link> : 'Member'}</strong>
                <span>Accepted · {humanize(item.intent)}</span>
                <p className="muted">{person ? labelForParticipantType(person.participant_type) : ''} · connected {dateTime(item.responded_at ?? item.created_at)}</p>
              </div>
            })}</div>}
      </div>
      <div className="card">
        <h2>Requests You Sent ({outgoing.length})</h2>
        {outgoing.length === 0
          ? <p className="muted">You haven’t sent any connection requests yet.</p>
          : <div className="history-list">{outgoing.map(item => {
              const person = personById.get(item.addressee_id)
              return <div key={item.id}>
                <strong>{person ? <Link href={`/dashboard/members/${item.addressee_id}`}>{person.full_name}</Link> : 'Member'}</strong>
                <p className="muted">{humanize(item.intent)} · Sent {dateTime(item.created_at)}</p>
                <ConnectionStatus row={item} viewer={profile.id} returnTo="/dashboard/network" />
              </div>
            })}</div>}
      </div>
    </section>}

    <section>
      <h2>Member directory</h2>
      <p className="muted">Verified members only. Only share messages and contact details you are comfortable providing to a connection.</p>
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
        : <div className="member-grid">{(directory ?? []).map(person => {
          const connection = relationship.get(person.id)
          return <article className="card member-card" key={person.id}>
            <Link className="member-identity member-identity-link" href={`/dashboard/members/${person.id}`}>
              <Avatar src={person.avatar_url} name={person.full_name} size={44} />
              <div>
                <strong>{person.full_name}<VerifiedCheck verified={person.is_verified} /></strong>{person.is_staff && <span className="status-dot status-verified">WTC Accra staff</span>}
                <ParticipantBadge type={person.participant_type} />
              </div>
            </Link>
            <p className="muted">{[person.job_title, person.organisation].filter(Boolean).join(' · ') || 'WTC Accra member'}</p>
            <p className="field-help">{[person.city, person.country].filter(Boolean).join(', ') || 'Location not set'}</p>

            {connection && <ConnectionStatus row={connection} viewer={profile.id} returnTo="/dashboard/network" />}
            {!connectionsError && (!connection || connection.status === 'declined' || connection.status === 'withdrawn')
                ? <details className="eoi-block connect-block">
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
                  </details> : null}

            <form action={toggleFollow}>
              <input type="hidden" name="target" value={person.id} />
              <input type="hidden" name="returnTo" value="/dashboard/network" />
              <button className={person.is_following ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">
                {person.is_following ? '✓ Following' : '+ Follow'}
              </button>
            </form>
          </article>
        })}</div>}
    </section>
  </div>
}
