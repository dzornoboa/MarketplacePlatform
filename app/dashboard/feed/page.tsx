import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { Avatar } from '@/components/avatar'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLockFor, humanize, labelForIntent, labelForParticipantType, listingIntents, listingIntentLabels } from '@/lib/auth/access'
import { money, date, relativeDays } from '@/lib/format'
import { displayImage } from '@/lib/media/image'
import { BrandCircle } from '@/components/brand'
import { requestConnection, respondToConnection, toggleFollow } from './actions'
import { toggleSaved } from '../opportunities/actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const SORTS = {
  recent: { label: 'Newest first', column: 'published_at', ascending: false },
  importance: { label: 'Most significant', column: 'importance', ascending: false },
  closing: { label: 'Closing soonest', column: 'deadline', ascending: true },
  capital: { label: 'Largest capital', column: 'capital_required', ascending: false },
} as const

function Stars({ rating }: { rating: number }) {
  return <span className="deal-rating" title={`Rated ${rating} of 5 by the WTC Accra trade desk`} aria-label={`Deal rating ${rating} of 5`}>
    {'★'.repeat(rating)}<span className="deal-rating-dim">{'★'.repeat(5 - rating)}</span>
  </span>
}

export default async function FeedPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const error = str('error') || null
  const message = str('message') || null

  const sortKey = (str('sort') in SORTS ? str('sort') : 'recent') as keyof typeof SORTS
  const sort = SORTS[sortKey]
  const category = str('category'), sector = str('sector'), country = str('country'), region = str('region')
  const intent = str('intent'), kind = str('kind'), followed = str('followed') === '1'
  const filtersApplied = !!(category || sector || country || region || intent || kind || followed)

  const state = await readAccessState(supabase)
  const lock = state
    ? marketplaceLockFor(state, profile.system_role)
    : { locked: true as const, reason: 'Access state unavailable.', action: null }

  // News is open to every signed-in user; member listings are not.
  const newsPromise = supabase.from('content_posts')
    .select('id,title,slug,excerpt,category,image_url,published_at')
    .eq('status', 'published').order('published_at', { ascending: false }).limit(6)

  let listingQuery = supabase.from('opportunities').select('*').eq('status', 'published').limit(200)
  if (category) listingQuery = listingQuery.eq('category', category)
  if (sector) listingQuery = listingQuery.eq('sector', sector)
  if (country) listingQuery = listingQuery.eq('country', country)
  if (region) listingQuery = listingQuery.eq('region', region)
  if (kind) listingQuery = listingQuery.eq('kind', kind as 'investment')
  if (intent) listingQuery = listingQuery.eq('intent', intent as 'seeking_investment')
  listingQuery = listingQuery.order(sort.column, { ascending: sort.ascending, nullsFirst: false })

  const [{ data: news }, { data: listings }, { data: followRows }, { data: savedRows }, { data: outgoingConnections }] = await Promise.all([
    newsPromise,
    lock.locked ? Promise.resolve({ data: [] }) : listingQuery,
    supabase.from('follows').select('following_id').eq('follower_id', profile.id),
    supabase.from('saved_opportunities').select('opportunity_id').eq('user_id', profile.id),
    supabase.from('connections').select('id,addressee_id,opportunity_id,status,staff_approved_at').eq('requester_id', profile.id),
  ])

  const followingIds = new Set((followRows ?? []).map(f => f.following_id))
  const savedIds = new Set((savedRows ?? []).map(row => row.opportunity_id))
  const connectionByDeal = new Map((outgoingConnections ?? []).filter(row => row.opportunity_id).map(row => [`${row.opportunity_id}:${row.addressee_id}`, row]))
  const displayTags = (tags: string[]) => tags.map(tag => tag.replace(/^category:/i,'').replaceAll('-', ' ')).filter(Boolean).join(', ')
  let visible = (listings ?? []).filter(o => o.owner_user_id !== profile.id)
  if (followed) visible = visible.filter(o => followingIds.has(o.owner_user_id))

  const ownerIds = [...new Set(visible.map(o => o.owner_user_id))]
  const { data: owners } = ownerIds.length
    ? await supabase.rpc('listing_owner_cards', { owner_ids: ownerIds })
    : { data: [] }
  const ownerById = new Map((owners ?? []).map(o => [o.id, o]))

  const facet = (key: keyof typeof visible[number]) =>
    [...new Set((listings ?? []).map(o => o[key]).filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Your network</p>
      <h1>Home</h1>
      <p className="muted">News from WTC Accra and live deals from verified members across the network.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {lock.locked && <section className="restriction-banner">
      <div>
        <strong>Restricted Deal Details Are Locked</strong>
        <p>{lock.reason} Until then you can still read WTC Accra news below.</p>
      </div>
      {lock.action && <Link className="button button-light" href={lock.action.href}>{lock.action.label}</Link>}
    </section>}

    {(news ?? []).length > 0 && <section>
      <div className="listing-head"><h2>News and resources</h2><Link className="arrow-link" href="/news">All news →</Link></div>
      <div className="article-grid">{(news ?? []).map(post => <article className="card article-card" key={post.id}>
        {displayImage(post.image_url) && <img className="article-image" src={displayImage(post.image_url) as string} alt="" />}
        <span className="eyebrow">{post.category === 'resource' ? 'Resource' : 'News'}</span>
        <h3><Link href={`/news/${post.slug}`}>{post.title}</Link></h3>
        {post.excerpt && <p className="muted">{post.excerpt}</p>}
        <p className="field-help">{date(post.published_at)}</p>
      </article>)}</div>
    </section>}

    {!lock.locked && <section>
      <div className="listing-head"><h2>Live Deals</h2><span className="muted">{visible.length} shown</span></div>

      <form className="filter-row card" method="get">
        <label>Sort
          <select name="sort" defaultValue={sortKey}>
            {Object.entries(SORTS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </label>
        <label>Posted as
          <select name="intent" defaultValue={intent}>
            <option value="">Any</option>
            {listingIntents.map(i => <option key={i} value={i}>{listingIntentLabels[i]}</option>)}
          </select>
        </label>
        <label>Deal Category
          <select name="category" defaultValue={category}>
            <option value="">All Deal Categories</option>
            {facet('category').map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>Deal Type
          <select name="kind" defaultValue={kind}>
            <option value="">All Deal Types</option>
            <option value="investment">Investment</option>
            <option value="trade">Trade</option>
            <option value="procurement">Procurement</option>
            <option value="partnership">Partnership</option>
          </select>
        </label>
        <label>Sector
          <select name="sector" defaultValue={sector}>
            <option value="">All sectors</option>
            {facet('sector').map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Region
          <select name="region" defaultValue={region}>
            <option value="">All regions</option>
            {facet('region').map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>Country
          <select name="country" defaultValue={country}>
            <option value="">All countries</option>
            {facet('country').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="switch"><input type="checkbox" name="followed" value="1" defaultChecked={followed} /> Only members I follow</label>
        <button className="button button-outline" type="submit">Apply</button>
        <Link className="text-link" href="/dashboard/opportunities">Reset</Link>
      </form>

      {visible.length === 0
        ? <section className="card empty-state">
            <BrandCircle />
            <h2>{filtersApplied ? 'Nothing matches those filters' : 'No Deals From Other Members Yet'}</h2>
            <p>{followed ? 'You may not be following anyone with a live listing yet.' : filtersApplied ? 'Try widening the filters.' : 'Your own deals do not appear here. As WTC Accra verifies more members and publishes deals, they will show up in this feed.'}</p>
          </section>
        : <div className="opportunity-list">{visible.map(item => {
            const owner = ownerById.get(item.owner_user_id)
            const following = followingIds.has(item.owner_user_id)
            return <article className="card opportunity-card feed-card" key={item.id}>
              <div className="opportunity-head">
                <div>
                  <div className="feed-meta">
                    <span className="eyebrow">{labelForIntent(item.intent)}</span>
                    <Stars rating={item.importance} />
                  </div>
                  <h3><Link href={`/dashboard/opportunities/${item.id}`}>{item.title}</Link></h3>
                  <p className="muted avatar-stack">
                    {owner && <Avatar src={owner.avatar_url} name={owner.full_name} size={22} />}
                    {owner ? <>{owner.organisation ?? owner.full_name}<VerifiedCheck verified={owner.is_verified} size={14} /> · {labelForParticipantType(owner.participant_type)} · </> : ''}
                    {item.category ? `${item.category} · ` : ''}{item.sector} · {item.city ? `${item.city}, ` : ''}{item.country}
                    {item.region ? ` · ${item.region}` : ''}
                    {item.deadline ? ` · ${relativeDays(item.deadline)}` : ''}
                  </p>
                </div>
                <div className="opportunity-figures">
                  <strong>{money(item.capital_required, item.currency)}</strong>
                  <span>{item.minimum_ticket ? `Min ${money(item.minimum_ticket, item.currency)}` : humanize(item.kind)}</span>
                </div>
              </div>
              <p>{item.summary}</p>
              {item.tags.length > 0 && <p className="compact-tags"><strong>Tags:</strong> {displayTags(item.tags)}</p>}

              <div className="feed-actions">
                <form action={toggleSaved}>
                  <input type="hidden" name="opportunityId" value={item.id} />
                  <input type="hidden" name="saved" value={savedIds.has(item.id) ? '1' : '0'} />
                  <input type="hidden" name="returnTo" value="/dashboard/feed" />
                  <button className={savedIds.has(item.id) ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">
                    {savedIds.has(item.id) ? '★ Saved' : '☆ Save'}
                  </button>
                </form>
                <form action={toggleFollow}>
                  <input type="hidden" name="target" value={item.owner_user_id} />
                  <input type="hidden" name="returnTo" value="/dashboard/feed" />
                  <button className={following ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">
                    {following ? '✓ Following' : '+ Follow'}
                  </button>
                </form>
                {(() => {
                  const request = connectionByDeal.get(`${item.id}:${item.owner_user_id}`)
                  if (request?.status === 'accepted') return <span className="status-dot status-verified">Connected</span>
                  if (request?.status === 'pending') return <div className="request-state-row">
                    <span className="status-dot status-pending">{request.staff_approved_at ? 'Approved · Awaiting Recipient' : 'Processing · WTC Accra Review'}</span>
                    <form action={respondToConnection}>
                      <input type="hidden" name="connectionId" value={request.id} />
                      <input type="hidden" name="returnTo" value="/dashboard/feed" />
                      <button className="link-button link-button-danger" name="decision" value="withdraw">Withdraw Request</button>
                    </form>
                  </div>
                  return <details className="eoi-block connect-block">
                    <summary>Request Connection About This Deal</summary>
                    <form action={requestConnection} className="form-stack">
                      <input type="hidden" name="addressee" value={item.owner_user_id} />
                      <input type="hidden" name="opportunityId" value={item.id} />
                      <input type="hidden" name="returnTo" value="/dashboard/feed" />
                      <label>Request Type
                        <select name="intent" defaultValue={item.intent === 'seeking_investment' ? 'invest' : 'connect'}>
                          <option value="invest">I Want To Invest</option>
                          <option value="buy">I Want To Buy</option>
                          <option value="partner">I Want To Partner</option>
                          <option value="connect">Just Connect</option>
                        </select>
                      </label>
                      <label>Message<textarea name="note" rows={3} maxLength={2000} placeholder="Introduce yourself and say what you are proposing." /></label>
                      <p className="field-help">This does not connect you directly. WTC Accra must approve the request before it is released to the other member.</p>
                      <SubmitButton>Send Request</SubmitButton>
                    </form>
                  </details>
                })()}
              </div>
            </article>
          })}</div>}
    </section>}
  </div>
}
