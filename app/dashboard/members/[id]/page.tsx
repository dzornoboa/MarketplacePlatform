import { ConnectionStatus } from '@/components/connection-status'
import { connectionByMember, connectionColumns } from '@/lib/connections'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/avatar'
import { BrandCircle } from '@/components/brand'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLock, humanize, labelForParticipantType } from '@/lib/auth/access'
import { money, date } from '@/lib/format'
import { query } from '@/lib/data/timeout'
import { requestConnection, toggleFollow } from '../../feed/actions'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/* A member's profile inside the platform: who they are, and the deals they have
   published. Following someone used to lead nowhere — the directory listed
   people but nothing about them was reachable. */
export default async function MemberProfilePage({ params, searchParams }: Props) {
  const { id } = await params
  const { supabase, profile } = await requireUserProfile()
  const search = await searchParams
  const error = typeof search.error === 'string' ? search.error : null
  const message = typeof search.message === 'string' ? search.message : null

  if (id === profile.id) {
    return <div className="page-stack narrow-content">
      <div><p className="eyebrow">Member</p><h1>This is you</h1></div>
      <section className="card empty-state">
        <BrandCircle />
        <h2>Your own profile</h2>
        <p>Open your profile to edit your details, or the network to find other members.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/dashboard/profile">Your profile</Link>
          <Link className="button button-outline" href="/dashboard/network">Back to network</Link>
        </div>
      </section>
    </div>
  }

  const state = await readAccessState(supabase)
  const lock = state ? marketplaceLock(state) : null
  if (!lock || lock.locked) {
    return <div className="page-stack narrow-content">
      <div><p className="eyebrow">Member</p><h1>Member profile</h1></div>
      <section className="restriction-banner">
        <div>
          <strong>Subscription required</strong>
          <p>{lock?.locked ? lock.reason : 'An active subscription is needed to view member profiles.'}</p>
        </div>
        {lock?.locked && lock.action && <Link className="button button-light" href={lock.action.href}>{lock.action.label}</Link>}
      </section>
    </div>
  }

  const returnTo = `/dashboard/members/${id}`
  const [{ data: people }, { data: cards }, { data: listings }, { data: follows }, { data: connections, error: connectionError }] = await Promise.all([
    query(supabase.rpc('member_directory', { search: null, participant: null, member_country: null, only_ids: [id], max_rows: 200 }), 'member'),
    query(supabase.rpc('listing_owner_cards', { owner_ids: [id] }), 'member card'),
    query(supabase.from('opportunities').select('*').eq('owner_user_id', id).eq('status', 'published').order('published_at', { ascending: false }).limit(60), 'member listings'),
    query(supabase.from('follows').select('following_id').eq('follower_id', profile.id).eq('following_id', id), 'following'),
    supabase.from('connections').select(connectionColumns).or(`and(requester_id.eq.${profile.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${profile.id})`),
  ])

  /* The directory is the richer source, but it is a search function: the row is
     matched by id rather than trusting it to have returned only this member.
     The owner card covers whoever the directory does not list. */
  const listed = (people ?? []).find(p => p.id === id)
  const card = (cards ?? [])[0]
  if (!listed && !card) notFound()
  const person = {
    id,
    full_name: listed?.full_name ?? card?.full_name ?? 'Member',
    job_title: listed?.job_title ?? card?.job_title ?? null,
    organisation: listed?.organisation ?? card?.organisation ?? null,
    participant_type: listed?.participant_type ?? card?.participant_type ?? null,
    country: listed?.country ?? card?.country ?? null,
    city: listed?.city ?? null,
    avatar_url: listed?.avatar_url ?? card?.avatar_url ?? null,
    is_verified: listed?.is_verified ?? card?.is_verified ?? false,
    is_staff: listed?.is_staff ?? false,
    is_following: (follows ?? []).length > 0,
  }
  const connection = connectionByMember(connections ?? [], profile.id).get(id)

  const place = [person.city, person.country].filter(Boolean).join(', ')
  const role = [person.job_title, person.organisation].filter(Boolean).join(' · ')

  return <div className="page-stack list-content">
    <RealtimeRefresh tables={['connections']} channel="member-connections" />
    <p><Link className="arrow-link" href="/dashboard/network">← Back to network</Link></p>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card member-profile-head">
      <Avatar src={person.avatar_url} name={person.full_name} size={88} />
      <div className="member-profile-identity">
        <h1>{person.full_name}<VerifiedCheck verified={person.is_verified} size={20} /></h1>
        <p className="avatar-stack">
          <ParticipantBadge type={person.participant_type} size="md" />
          {person.is_staff && <span className="status-dot status-verified">WTC Accra staff</span>}
        </p>
        <p className="muted">{role || labelForParticipantType(person.participant_type)}</p>
        <p className="field-help">{place || 'Location not set'}</p>
      </div>
      <div className="member-profile-actions">
        <form action={toggleFollow}>
          <input type="hidden" name="target" value={person.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className={person.is_following ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">
            {person.is_following ? '✓ Following' : '+ Follow'}
          </button>
        </form>
        {connection && <ConnectionStatus row={connection} viewer={profile.id} returnTo={returnTo} />}
        {connectionError && <p className="field-help">Connection status unavailable. Refresh to try again.</p>}
        {!connectionError && (!connection || connection.status === 'declined' || connection.status === 'withdrawn') && <details className="eoi-block connect-block">
          <summary>Connect</summary>
          <form action={requestConnection} className="form-stack">
            <input type="hidden" name="addressee" value={person.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
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
      </div>
    </section>

    <section>
      <h2>Live deals from {person.full_name.split(' ')[0]}</h2>
      {(listings ?? []).length === 0
        ? <section className="card empty-state">
            <BrandCircle />
            <h2>Nothing published yet</h2>
            <p>{person.full_name} has not published a deal on the marketplace. Following them means new ones reach your home feed.</p>
          </section>
        : <div className="opportunity-list">{(listings ?? []).map(listing => <article className="card opportunity-card" key={listing.id}>
            <div className="opportunity-head">
              <div>
                <span className="status-dot">{humanize(listing.kind)}</span>
                <h3><Link href={`/dashboard/opportunities/${listing.id}`}>{listing.title}</Link></h3>
              </div>
            </div>
            <p className="muted">{listing.summary ?? ''}</p>
            <dl className="detail-grid">
              <div><dt>Capital</dt><dd>{listing.capital_required != null ? money(listing.capital_required, listing.currency ?? 'USD') : '—'}</dd></div>
              <div><dt>Sector</dt><dd>{listing.sector ?? '—'}</dd></div>
              <div><dt>Country</dt><dd>{listing.country ?? '—'}</dd></div>
              <div><dt>Published</dt><dd>{date(listing.published_at)}</dd></div>
            </dl>
            <p><Link className="arrow-link" href={`/dashboard/opportunities/${listing.id}`}>Open the deal →</Link></p>
          </article>)}</div>}
    </section>
  </div>
}
