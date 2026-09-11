import Link from 'next/link'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLockFor, humanize, labelForIntent, labelForParticipantType, listingIntents, listingIntentLabels } from '@/lib/auth/access'
import { money, date, relativeDays } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { requestConnection, toggleFollow } from './actions'

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
  const sector = str('sector'), country = str('country'), region = str('region')
  const intent = str('intent'), kind = str('kind'), followed = str('followed') === '1'

  const state = await readAccessState(supabase)
  const lock = state
    ? marketplaceLockFor(state, profile.system_role)
    : { locked: true as const, reason: 'Access state unavailable.', action: null }

  // News is open to every signed-in user; member listings are not.
  const newsPromise = supabase.from('content_posts')
    .select('id,title,slug,excerpt,category,image_url,published_at')
    .eq('status', 'published').order('published_at', { ascending: false }).limit(6)

  let listingQuery = supabase.from('opportunities').select('*').eq('status', 'published').limit(60)
  if (sector) listingQuery = listingQuery.eq('sector', sector)
  if (country) listingQuery = listingQuery.eq('country', country)
  if (region) listingQuery = listingQuery.eq('region', region)
  if (kind) listingQuery = listingQuery.eq('kind', kind as 'investment')
  if (intent) listingQuery = listingQuery.eq('intent', intent as 'seeking_investment')
  listingQuery = listingQuery.order(sort.column, { ascending: sort.ascending, nullsFirst: false })

  const [{ data: news }, { data: listings }, { data: followRows }] = await Promise.all([
    newsPromise,
    lock.locked ? Promise.resolve({ data: [] }) : listingQuery,
    supabase.from('follows').select('following_id').eq('follower_id', profile.id),
  ])

  const followingIds = new Set((followRows ?? []).map(f => f.following_id))
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
      <p className="muted">News from WTC Accra, and live listings from verified members across the network.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {lock.locked && <section className="restriction-banner">
      <div>
        <strong>Member listings are hidden</strong>
        <p>{lock.reason} Until then you can still read WTC Accra news below.</p>
      </div>
      {lock.action && <Link className="button button-light" href={lock.action.href}>{lock.action.label}</Link>}
    </section>}

    {(news ?? []).length > 0 && <section>
      <div className="listing-head"><h2>News and resources</h2><Link className="arrow-link" href="/news">All news →</Link></div>
      <div className="article-grid">{(news ?? []).map(post => <article className="card article-card" key={post.id}>
        {post.image_url && <img className="article-image" src={post.image_url} alt="" />}
        <span className="eyebrow">{post.category === 'resource' ? 'Resource' : 'News'}</span>
        <h3><Link href={`/news/${post.slug}`}>{post.title}</Link></h3>
        {post.excerpt && <p className="muted">{post.excerpt}</p>}
        <p className="field-help">{date(post.published_at)}</p>
      </article>)}</div>
    </section>}

    {!lock.locked && <section>
      <div className="listing-head"><h2>Live listings</h2><span className="muted">{visible.length} shown</span></div>

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
        <label>Category
          <select name="kind" defaultValue={kind}>
            <option value="">All categories</option>
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
        <Link className="text-link" href="/dashboard/feed">Reset</Link>
      </form>

      {visible.length === 0
        ? <section className="card empty-state">
            <BrandCircle />
            <h2>Nothing matches those filters</h2>
            <p>{followed ? 'You may not be following anyone with a live listing yet.' : 'Try widening the filters, or check back as WTC Accra publishes new listings.'}</p>
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
                  <p className="muted">
                    {owner ? `${owner.organisation ?? owner.full_name} · ${labelForParticipantType(owner.participant_type)} · ` : ''}
                    {item.sector} · {item.city ? `${item.city}, ` : ''}{item.country}
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
              {item.tags.length > 0 && <div className="trust-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}

              <div className="feed-actions">
                <form action={toggleFollow}>
                  <input type="hidden" name="target" value={item.owner_user_id} />
                  <input type="hidden" name="returnTo" value="/dashboard/feed" />
                  <button className={following ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">
                    {following ? '✓ Following' : '+ Follow'}
                  </button>
                </form>
                <details className="eoi-block connect-block">
                  <summary>Connect about this listing</summary>
                  <form action={requestConnection} className="form-stack">
                    <input type="hidden" name="addressee" value={item.owner_user_id} />
                    <input type="hidden" name="opportunityId" value={item.id} />
                    <input type="hidden" name="returnTo" value="/dashboard/feed" />
                    <label>Request type
                      <select name="intent" defaultValue={item.intent === 'seeking_investment' ? 'invest' : 'connect'}>
                        <option value="invest">I want to invest</option>
                        <option value="buy">I want to buy</option>
                        <option value="partner">I want to partner</option>
                        <option value="connect">Just connect</option>
                      </select>
                    </label>
                    <label>Message<textarea name="note" rows={3} maxLength={2000} placeholder="Introduce yourself and say what you are proposing." /></label>
                    <p className="field-help">WTC Accra is copied on every request, with the deal summary and the process. Keep the transaction on the platform.</p>
                    <button className="button button-primary" type="submit">Send request</button>
                  </form>
                </details>
              </div>
            </article>
          })}</div>}
    </section>}
  </div>
}
