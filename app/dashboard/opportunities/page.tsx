import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLockFor, postingLockFor, humanize, labelForIntent } from '@/lib/auth/access'
import { money, date, relativeDays } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { submitOpportunity, expressInterest, toggleSaved, withdrawOpportunity, deleteOpportunity } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function OpportunitiesPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const sector = typeof params.sector === 'string' ? params.sector : ''
  const kind = typeof params.kind === 'string' ? params.kind : ''
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const sort = typeof params.sort === 'string' && ['newest', 'oldest', 'amount', 'deadline'].includes(params.sort) ? params.sort : 'newest'
  const mineSort = typeof params.mine === 'string' && ['updated', 'status', 'title'].includes(params.mine) ? params.mine : 'updated'

  const state = await readAccessState(supabase)
  const browseLock = state ? marketplaceLockFor(state, profile.system_role) : { locked: true as const, reason: 'Access state unavailable.', action: null }
  const postLock = state ? postingLockFor(state, profile.system_role) : { locked: true as const, reason: 'Access state unavailable.', action: null }

  // RLS returns only what this member may see; the filters are UX, not security.
  let query = supabase.from('opportunities').select('*').eq('status', 'published').limit(100)
  if (sector) query = query.eq('sector', sector)
  if (kind) query = query.eq('kind', kind as 'investment')
  if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,country.ilike.%${q}%`)
  query = sort === 'amount' ? query.order('capital_required', { ascending: false, nullsFirst: false })
    : sort === 'deadline' ? query.order('deadline', { ascending: true, nullsFirst: false })
    : query.order('published_at', { ascending: sort === 'oldest' })
  const [{ data: published }, { data: mine }, { data: sentInterests }, { data: savedRows }] = await Promise.all([
    browseLock.locked ? Promise.resolve({ data: [] }) : query,
    supabase.from('opportunities').select('*').eq('owner_user_id', profile.id).order(mineSort === 'title' ? 'title' : mineSort === 'status' ? 'status' : 'updated_at', { ascending: mineSort !== 'updated' }),
    supabase.from('expressions_of_interest').select('opportunity_id').eq('applicant_id', profile.id),
    supabase.from('saved_opportunities').select('opportunity_id'),
  ])
  const alreadyApplied = new Set((sentInterests ?? []).map(e => e.opportunity_id))
  const savedIds = new Set((savedRows ?? []).map(r => r.opportunity_id))
  const sectors = [...new Set((published ?? []).map(o => o.sector))].sort()

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
      {sector && <input type="hidden" name="sector" value={sector} />}{kind && <input type="hidden" name="kind" value={kind} />}{q && <input type="hidden" name="q" value={q} />}{sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
      <label>Sort your listings<select name="mine" defaultValue={mineSort}><option value="updated">Recently updated</option><option value="status">By status</option><option value="title">Title A–Z</option></select></label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>}

    {(mine ?? []).length > 0 && <div className="opportunity-list">
      {(mine ?? []).map(item => <article className="card opportunity-card" key={item.id}>
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
        <p>{item.summary}</p>
        {item.review_note && <p className="field-help">Reviewer note: {item.review_note}</p>}
        <div className="button-row listing-actions">
          <Link className="button button-outline" href={`/dashboard/opportunities/${item.id}`}>View</Link>
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
        <label>Sector
          <select name="sector" defaultValue={sector}>
            <option value="">All sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Type
          <select name="kind" defaultValue={kind}>
            <option value="">All types</option>
            <option value="investment">Investment</option>
            <option value="trade">Trade</option>
            <option value="procurement">Procurement</option>
            <option value="partnership">Partnership</option>
          </select>
        </label>
        <label>Sort
          <select name="sort" defaultValue={sort}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount">Largest capital</option><option value="deadline">Closing soonest</option>
          </select>
        </label>
        <button className="button button-outline" type="submit">Filter</button>
      </form>

      {(published ?? []).length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>{q || sector || kind ? 'No listings match' : 'No published opportunities yet'}</h2><p>{q || sector || kind ? 'Try a different search or filter.' : 'New listings appear here as WTC Accra approves them.'}</p></section>
        : <div className="opportunity-list">{(published ?? []).map(item => { const own = item.owner_user_id === profile.id; return (
            <article className={own ? 'card opportunity-card opportunity-own' : 'card opportunity-card'} key={item.id}>
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
              <p>{item.summary}</p>
              {item.tags.length > 0 && <div className="trust-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
              {!own && <form action={toggleSaved} className="save-row">
                <input type="hidden" name="opportunityId" value={item.id} />
                <input type="hidden" name="saved" value={savedIds.has(item.id) ? '1' : '0'} />
                <button className={savedIds.has(item.id) ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">{savedIds.has(item.id) ? '★ Saved to shortlist' : '☆ Save to shortlist'}</button>
              </form>}
              {!own && <details className="eoi-block">
                <summary>{alreadyApplied.has(item.id) ? 'Interest already sent — send another note' : 'Express interest'}</summary>
                <form action={expressInterest} className="form-stack">
                  <input type="hidden" name="opportunityId" value={item.id} />
                  <label>Message to the owner<textarea name="message" rows={4} minLength={20} maxLength={3000} required placeholder="Introduce yourself and explain the fit." /></label>
                  <SubmitButton>Send expression of interest</SubmitButton>
                </form>
              </details>}
              <p className="field-help">Published {date(item.published_at)}{own ? ' · this is how members see your listing' : ''}</p>
            </article>) })}</div>}
    </section>}
  </div>
}
