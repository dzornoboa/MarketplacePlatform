import { filterOptions, opportunityKind, opportunityKinds, searchColumns } from '@/lib/filters'
import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLockFor, postingLockFor, humanize, labelForIntent } from '@/lib/auth/access'
import { money, date, relativeDays } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { investmentBands } from '@/lib/deals/investment-bands'
import { submitOpportunity, expressInterest, toggleSaved, withdrawOpportunity, deleteOpportunity, withdrawDeal } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function OpportunitiesPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const sector = typeof params.sector === 'string' ? params.sector : ''
  const investmentBand = typeof params.band === 'string' && investmentBands.some(b => b.code === params.band) ? params.band : ''
  const kind = opportunityKind(params.kind)
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const sort = typeof params.sort === 'string' && ['newest', 'oldest', 'amount', 'deadline'].includes(params.sort) ? params.sort : 'newest'
  const mineSort = typeof params.mine === 'string' && ['updated', 'status', 'title'].includes(params.mine) ? params.mine : 'updated'

  const state = await readAccessState(supabase)
  const browseLock = state ? marketplaceLockFor(state, profile.system_role) : { locked: true as const, reason: 'Access state unavailable.', action: null }
  const postLock = state ? postingLockFor(state, profile.system_role) : { locked: true as const, reason: 'Access state unavailable.', action: null }

  // Apply the same filters to the results and the type counts, using this member's RLS.
  const band = investmentBands.find(option => option.code === investmentBand)
  const publishedQuery = (countOnly = false) => {
    let query = supabase.from('opportunities').select('*', countOnly ? { count: 'exact', head: true } : undefined).eq('status', 'published')
    if (sector) query = query.eq('sector', sector)
    if (band) {
      query = query.eq('kind', 'investment').gt('capital_required_usd', band.minExclusive)
      if (band.maxInclusive !== null) query = query.lte('capital_required_usd', band.maxInclusive)
    }
    if (q) query = query.or(searchColumns(q, ['title', 'summary', 'country']))
    return query
  }
  let query = publishedQuery().limit(100)
  if (kind) query = query.eq('kind', kind)
  query = sort === 'amount' ? query.order('capital_required_usd', { ascending: false, nullsFirst: false })
    : sort === 'deadline' ? query.order('deadline', { ascending: true, nullsFirst: false })
    : query.order('published_at', { ascending: sort === 'oldest' })
  const [{ data: published, error: publishedError }, { data: mine }, { data: sentInterests }, { data: savedRows }, { data: facets, error: facetsError }, typeCounts] = await Promise.all([
    browseLock.locked ? Promise.resolve({ data: [], error: null }) : query,
    supabase.from('opportunities').select('*').eq('owner_user_id', profile.id).order(mineSort === 'title' ? 'title' : mineSort === 'status' ? 'status' : 'updated_at', { ascending: mineSort !== 'updated' }),
    supabase.from('expressions_of_interest').select('id,opportunity_id,status').eq('applicant_id', profile.id),
    supabase.from('saved_opportunities').select('opportunity_id'),
    browseLock.locked ? Promise.resolve({ data: [], error: null }) : supabase.rpc('public_listing_facets'),
    browseLock.locked ? [] : Promise.all(opportunityKinds.map(async type => {
      const { count } = await publishedQuery(true).eq('kind', type)
      return [type, count] as const
    })),
  ])
  const interestByOpportunity = new Map((sentInterests ?? []).map(e => [e.opportunity_id, e]))
  const savedIds = new Set((savedRows ?? []).map(r => r.opportunity_id))
  const requestLabel = (status: string) => status === 'submitted' ? 'Processing' : status === 'under_review' ? 'Processed' : status === 'accepted' ? 'Connected' : status === 'declined' ? 'Declined' : 'Withdrawn'
  const sectors = filterOptions((facets ?? []).filter(f => f.facet === 'sector').map(f => f.value), sector)

  const countByType = new Map(typeCounts)
  const filtered = Boolean(q || sector || kind || band)
  const clearTypeParams = new URLSearchParams()
  if (q) clearTypeParams.set('q', q)
  if (sector) clearTypeParams.set('sector', sector)
  if (band) clearTypeParams.set('band', band.code)
  if (sort !== 'newest') clearTypeParams.set('sort', sort)
  if (mineSort !== 'updated') clearTypeParams.set('mine', mineSort)
  const clearTypeHref = `/dashboard/opportunities${clearTypeParams.size ? `?${clearTypeParams}` : ''}`
  const otherTypesAvailable = kind && typeCounts.some(([type, count]) => type !== kind && (count ?? 0) > 0)

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Private marketplace</p>
      <h1>Opportunities</h1>
      <p className="muted">Investment, trade, procurement and partnership listings from verified WTC Accra participants.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {browseLock.locked && <section className="restriction-banner">
      <div><strong>Opportunity browsing is locked</strong><p>{browseLock.reason}</p></div>
      {browseLock.action && <Link className="button button-light" href={browseLock.action.href}>{browseLock.action.label}</Link>}
    </section>}

    <section className="card listing-head">
      <div>
        <h2>Your listings</h2>
        <p className="muted">{postLock.locked ? postLock.reason : 'Publish an opportunity for verified, subscribed members to discover.'}</p>
      </div>
      {postLock.locked
        ? (postLock.action && <Link className="button button-outline" href={postLock.action.href}>{postLock.action.label}</Link>)
        : <Link className="button button-primary" href="/dashboard/opportunities/new">Post an opportunity</Link>}
    </section>

    {(mine ?? []).length > 1 && <form className="filter-row" method="get">
      {investmentBand && <input type="hidden" name="band" value={investmentBand} />}{sector && <input type="hidden" name="sector" value={sector} />}{kind && <input type="hidden" name="kind" value={kind} />}{q && <input type="hidden" name="q" value={q} />}{sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
      <label>Sort your listings<select name="mine" defaultValue={mineSort}><option value="updated">Recently updated</option><option value="status">By status</option><option value="title">Title A–Z</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>}

    {(mine ?? []).length > 0 && <div className="opportunity-list">
      {(mine ?? []).map(item => <article className="card opportunity-card listing-preview" key={item.id}>
        <div className="opportunity-head">
          <div>
            <span className={`status-dot status-opp-${item.status}`}>{humanize(item.status)}</span>
            <h3><Link href={`/dashboard/opportunities/${item.id}`}>{item.title}</Link></h3>
            <p className="muted">{item.sector} · {item.city ? `${item.city}, ` : ''}{item.country} · {humanize(item.kind)}</p>
          </div>
          <div className="opportunity-figures">
            <strong>{money(item.capital_required, item.currency)}</strong>
            <span>{item.minimum_ticket ? `Min ${money(item.minimum_ticket, item.currency)}` : 'No minimum set'}</span>
          </div>
        </div>
        <p className="listing-preview-summary">{item.summary}</p>
        {item.review_note && <p className="field-help">Reviewer note: {item.review_note}</p>}
        <div className="button-row listing-actions">
          <Link className="button button-outline" href={`/dashboard/opportunities/${item.id}`}>See more →</Link>
          {['draft', 'changes_requested', 'rejected'].includes(item.status) && <Link className="button button-outline" href={`/dashboard/opportunities/${item.id}/edit`}>Edit</Link>}
          {(item.status === 'draft' || item.status === 'changes_requested') && !postLock.locked &&
            <form action={submitOpportunity}>
              <input type="hidden" name="opportunityId" value={item.id} />
              <SubmitButton pendingLabel="Submitting…">Submit for review</SubmitButton>
            </form>}
          {['submitted', 'in_review', 'published'].includes(item.status) &&
            <form action={withdrawOpportunity}>
              <input type="hidden" name="opportunityId" value={item.id} />
              <SubmitButton className="button button-outline" pendingLabel="Withdrawing…">{item.status === 'published' ? 'Unpublish' : 'Withdraw from review'}</SubmitButton>
            </form>}
          {['draft', 'changes_requested', 'rejected'].includes(item.status) &&
            <form action={deleteOpportunity}>
              <input type="hidden" name="opportunityId" value={item.id} />
              <SubmitButton className="button button-danger" pendingLabel="Deleting…">Delete</SubmitButton>
            </form>}
        </div>
      </article>)}
    </div>}

    {!browseLock.locked && <section>
      <h2>Published opportunities</h2>
      <form className="filter-row" method="get">
        {mineSort !== 'updated' && <input type="hidden" name="mine" value={mineSort} />}
        <label>Search<input name="q" defaultValue={q} placeholder="Title, summary or country" /></label>
        <label>Investment Size (USD)<select name="band" defaultValue={investmentBand}><option value="">All Investment Sizes</option>{investmentBands.map(b => <option key={b.code} value={b.code}>{b.label}</option>)}</select></label>
        <label>Sector
          <select name="sector" defaultValue={sector}>
            <option value="">All sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Type
          <select name="kind" defaultValue={kind}>
            <option value="">All types</option>
            {opportunityKinds.map(type => {
              const count = countByType.get(type)
              return <option key={type} value={type}>{humanize(type)}{count != null ? ` (${count})` : ''}</option>
            })}
          </select>
        </label>
        <label>Sort
          <select name="sort" defaultValue={sort}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount">Largest capital</option><option value="deadline">Closing soonest</option>
          </select>
        </label>
        <button className="button button-outline" type="submit">Filter</button>
        {(q || investmentBand || sector || kind || sort !== 'newest') && <Link className="text-link" href={mineSort === 'updated' ? '/dashboard/opportunities' : `?mine=${mineSort}`}>Reset filters</Link>}
      </form>

      {facetsError && <p className="alert alert-error" role="alert">Some filters could not be loaded. Refresh the page to try again.</p>}
      {publishedError
        ? <section className="card empty-state"><h2>Could not load listings</h2><p>Refresh the page to try again.</p></section>
        : (published ?? []).length === 0
        ? <section className="card empty-state">
            <BrandCircle />
            <h2>{filtered ? 'No listings match' : 'No published opportunities yet'}</h2>
            <p>{otherTypesAvailable
              ? `No ${humanize(kind).toLowerCase()} listings match these filters. Other listing types are available.`
              : filtered ? 'Try a different search or filter.' : 'New listings appear here as WTC Accra approves them.'}</p>
            {otherTypesAvailable && <Link className="button button-outline" href={clearTypeHref}>Show all matching types</Link>}
          </section>
        : <div className="opportunity-list">{(published ?? []).map(item => { const own = item.owner_user_id === profile.id; return (
            <article className={own ? 'card opportunity-card listing-preview opportunity-own' : 'card opportunity-card listing-preview'} key={item.id}>
              <div className="opportunity-head">
                <div>
                  <span className="eyebrow">{labelForIntent(item.intent)} · {humanize(item.kind)}{own && <span className="own-badge">Yours</span>}</span>
                  <h3><Link href={`/dashboard/opportunities/${item.id}`}>{item.title}</Link></h3>
                  <p className="muted">{item.sector} · {item.city ? `${item.city}, ` : ''}{item.country}{item.deadline ? ` · ${relativeDays(item.deadline)}` : ''}</p>
                </div>
                <div className="opportunity-figures">
                  <strong>{money(item.capital_required, item.currency)}</strong>
                  <span>{item.minimum_ticket ? `Min ${money(item.minimum_ticket, item.currency)}` : 'No minimum set'}</span>
                </div>
              </div>
              <p className="listing-preview-summary">{item.summary}</p>
              <Link className="arrow-link" href={`/dashboard/opportunities/${item.id}`} aria-label={`See more about ${item.title}`}>See more →</Link>
              {!own && <form action={toggleSaved} className="save-row">
                <input type="hidden" name="opportunityId" value={item.id} />
                <input type="hidden" name="saved" value={savedIds.has(item.id) ? '1' : '0'} />
                <button className={savedIds.has(item.id) ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">{savedIds.has(item.id) ? '★ Saved to shortlist' : '☆ Save to shortlist'}</button>
              </form>}
              {!own && (() => {
                const request = interestByOpportunity.get(item.id)
                if (request) return <div className="request-state-row">
                  <span className={`status-dot status-eoi-${request.status}`}>{requestLabel(request.status)}</span>
                  {(request.status === 'submitted' || request.status === 'under_review') && <form action={withdrawDeal}>
                    <input type="hidden" name="eoiId" value={request.id} />
                    <SubmitButton className="button button-outline" pendingLabel="Withdrawing…">Withdraw Request</SubmitButton>
                  </form>}
                  <Link className="arrow-link" href="/dashboard/interests">Track Deal →</Link>
                </div>
                return <details className="eoi-block">
                  <summary>Express Interest</summary>
                  <form action={expressInterest} className="form-stack">
                    <input type="hidden" name="opportunityId" value={item.id} />
                    <label>Message To The Owner<textarea name="message" rows={4} minLength={20} maxLength={3000} required placeholder="Introduce yourself and explain the fit." /></label>
                    <SubmitButton>Send Deal Request</SubmitButton>
                  </form>
                </details>
              })()}
              <p className="field-help">Published {date(item.published_at)}{own ? ' · this is how members see your listing' : ''}</p>
            </article>) })}</div>}
    </section>}
  </div>
}
