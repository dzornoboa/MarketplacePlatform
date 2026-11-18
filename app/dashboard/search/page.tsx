import Link from 'next/link'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { anonymousDealTitle, humanize, labelForParticipantType, marketplaceLock } from '@/lib/auth/access'
import { filterOptions, searchColumns } from '@/lib/filters'
import { containsSearchPhrase, suggestSearchResults } from '@/lib/search'
import { createPublicClient } from '@/lib/supabase/public'

export const metadata = { title: 'Search' }

const resultTypes = { members: 'Members', listings: 'Listings', news: 'News and resources' } as const
type ResultType = keyof typeof resultTypes
type Result = { id: string; type: ResultType; title: string; href: string; detail: string; excerpt?: string; keywords?: string }
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

function ResultList({ results }: { results: Result[] }) {
  return <ul className="search-results">
    {results.map(result => <li className="card" key={`${result.type}-${result.id}`}>
      <p className="eyebrow">{resultTypes[result.type]}</p>
      <h3><Link href={result.href}>{result.title}</Link></h3>
      {result.detail && <p className="muted">{result.detail}</p>}
      {result.excerpt && <p>{result.excerpt}</p>}
    </li>)}
  </ul>
}

export default async function SearchPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const str = (key: string) => typeof params[key] === 'string' ? params[key].trim() : ''
  const query = str('q').slice(0, 120)
  const requestedType = str('type')
  const type = Object.hasOwn(resultTypes, requestedType) ? requestedType as ResultType : ''
  const sector = str('sector').slice(0, 160)
  const inScope = (value: ResultType) => type ? type === value : !sector || value === 'listings'
  const state = await readAccessState(supabase)
  const lock = state ? marketplaceLock(state) : null
  const fullAccess = Boolean(lock && !lock.locked)
  const publicClient = createPublicClient()

  const [publicFacets, privateFacets] = await Promise.all([
    publicClient.rpc('public_listing_facets'),
    fullAccess ? supabase.rpc('public_listing_facets') : null,
  ])
  const sectors = filterOptions([...(publicFacets.data ?? []), ...(privateFacets?.data ?? [])]
    .filter(facet => facet.facet === 'sector').map(facet => facet.value), sector)

  async function readResults(phrase: string, limit: number) {
    // Use session RLS for full listings and a cookie-less client for public previews.
    // The anonymous RPC's free-text fields are deliberately excluded from search.
    let listings = supabase.from('opportunities').select('id,title,summary,sector,country,kind,category')
      .eq('status', 'published').order('published_at', { ascending: false }).limit(limit)
    if (sector) listings = listings.eq('sector', sector)
    if (phrase) listings = listings.or(searchColumns(phrase, ['title', 'summary', 'sector', 'country', 'category']))

    let news = supabase.from('content_posts').select('id,title,slug,excerpt,category')
      .eq('status', 'published').order('published_at', { ascending: false }).limit(limit)
    if (phrase) news = news.or(searchColumns(phrase, ['title', 'excerpt', 'category']))

    const [members, privateListings, previews, articles] = await Promise.all([
      inScope('members') && fullAccess ? supabase.rpc('member_directory', { search: phrase || null, max_rows: limit }) : null,
      inScope('listings') && fullAccess ? listings : null,
      inScope('listings') && !fullAccess ? publicClient.rpc('public_listing_teasers', { listing_sector: sector || null, max_rows: phrase ? 200 : limit }) : null,
      inScope('news') ? news : null,
    ])

    const results: Result[] = [
      ...(members?.data ?? []).filter(member => member.id !== profile.id).map(member => ({
        id: member.id, type: 'members' as const, title: member.full_name, href: `/dashboard/members/${member.id}`,
        detail: [member.organisation, member.job_title, labelForParticipantType(member.participant_type), member.country].filter(Boolean).join(' · '),
      })),
      ...(privateListings?.data ?? []).map(listing => ({
        id: listing.id, type: 'listings' as const, title: listing.title, href: `/dashboard/opportunities/${listing.id}`,
        detail: [humanize(listing.kind), listing.sector, listing.country].filter(Boolean).join(' · '),
        excerpt: listing.summary, keywords: listing.category ?? undefined,
      })),
      ...(previews?.data ?? []).map(listing => ({
        id: listing.id, type: 'listings' as const, title: anonymousDealTitle(listing), href: `/opportunities/${listing.id}`,
        detail: 'Anonymous listing preview', keywords: listing.category ?? undefined,
      })).filter(listing => !phrase || containsSearchPhrase(phrase, `${listing.title} ${listing.keywords ?? ''}`)).slice(0, limit),
      ...(articles?.data ?? []).map(article => ({
        id: article.id, type: 'news' as const, title: article.title, href: `/news/${article.slug}`,
        detail: article.excerpt ?? humanize(article.category),
      })),
    ]

    return { results, failed: [members, privateListings, previews, articles].some(source => source?.error) }
  }

  const { results, failed } = query || type || sector ? await readResults(query, 24) : { results: [], failed: false }
  const pool = query && !results.length ? await readResults('', 120) : null
  const suggestions = pool ? suggestSearchResults(query, pool.results, item => `${item.title} ${item.detail} ${item.excerpt ?? ''} ${item.keywords ?? ''}`) : []
  const searched = Boolean(query || type || sector)
  const resetHref = query ? `/dashboard/search?${new URLSearchParams({ q: query })}` : '/dashboard/search'

  return <div className="page-stack">
    <div><h1>Search</h1><p className="muted">Find members, investment and trade listings, news, and resources.</p></div>
    <form className="card filter-row dashboard-search-form" action="/dashboard/search" method="get" role="search">
      <label>Search terms<input name="q" type="search" defaultValue={query} maxLength={120} placeholder="Name, organisation, sector or topic" /></label>
      <label>Result type<select name="type" defaultValue={type}>
        <option value="">All results</option>
        {Object.entries(resultTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Listing sector<select name="sector" defaultValue={sector}>
        <option value="">All sectors</option>
        {sectors.map(value => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <button type="submit" className="button button-primary">Search</button>
      {(type || sector) && <Link href={resetHref} className="text-link">Clear filters</Link>}
    </form>

    {inScope('members') && !fullAccess && <div className="alert">
      Member directory results require marketplace access. {lock?.locked && lock.action && <Link href={lock.action.href}>{lock.action.label}</Link>}
    </div>}
    {(failed || pool?.failed) && <div className="alert alert-error" role="status">Some results could not be loaded. Try again in a moment.</div>}

    {searched && <section className="page-stack" aria-label="Search results">
      {results.length > 0 ? <>
        <h2>{query ? `Results for “${query}”` : 'Search results'}</h2>
        <ResultList results={results} />
      </> : <>
        <h2>{failed ? 'No results loaded' : query ? `No direct matches for “${query}”` : 'No results match these filters'}</h2>
        {suggestions.length > 0 ? <section className="page-stack"><h3>Suggested results</h3><ResultList results={suggestions} /></section> :
          <p className="muted">Try a shorter phrase, a different spelling, or a broader filter.</p>}
      </>}
    </section>}

    {(!searched || !results.length) && <nav className="button-row" aria-label="Browse search categories">
      <Link href="/dashboard/search?type=listings" className="button button-outline">Browse listings</Link>
      <Link href="/dashboard/search?type=news" className="button button-outline">Browse news</Link>
      {fullAccess && <Link href="/dashboard/search?type=members" className="button button-outline">Browse members</Link>}
    </nav>}
  </div>
}
