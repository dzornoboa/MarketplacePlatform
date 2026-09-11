import Link from 'next/link'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLockFor, postingLockFor, humanize, labelForIntent } from '@/lib/auth/access'
import { money, date, relativeDays } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { submitOpportunity, expressInterest, toggleSaved } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function OpportunitiesPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const sector = typeof params.sector === 'string' ? params.sector : ''
  const kind = typeof params.kind === 'string' ? params.kind : ''

  const state = await readAccessState(supabase)
  const browseLock = state ? marketplaceLockFor(state, profile.system_role) : { locked: true as const, reason: 'Access state unavailable.', action: null }
  const postLock = state ? postingLockFor(state, profile.system_role) : { locked: true as const, reason: 'Access state unavailable.', action: null }

  // RLS returns only what this member may see; the filters are UX, not security.
  let query = supabase.from('opportunities').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(60)
  if (sector) query = query.eq('sector', sector)
  if (kind) query = query.eq('kind', kind as 'investment')
  const [{ data: published }, { data: mine }, { data: sentInterests }, { data: savedRows }] = await Promise.all([
    browseLock.locked ? Promise.resolve({ data: [] }) : query,
    supabase.from('opportunities').select('*').eq('owner_user_id', profile.id).order('updated_at', { ascending: false }),
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

    {(mine ?? []).length > 0 && <div className="opportunity-list">
      {(mine ?? []).map(item => <article className="card opportunity-card" key={item.id}>
        <div className="opportunity-head">
          <div>
            <span className={`status-dot status-opp-${item.status}`}>{humanize(item.status)}</span>
            <h3>{item.title}</h3>
            <p className="muted">{item.sector} · {item.city ? `${item.city}, ` : ''}{item.country} · {humanize(item.kind)}</p>
          </div>
          <div className="opportunity-figures">
            <strong>{money(item.capital_required, item.currency)}</strong>
            <span>{item.minimum_ticket ? `Min ${money(item.minimum_ticket, item.currency)}` : 'No minimum set'}</span>
          </div>
        </div>
        <p>{item.summary}</p>
        {item.review_note && <p className="field-help">Reviewer note: {item.review_note}</p>}
        {(item.status === 'draft' || item.status === 'changes_requested') && !postLock.locked &&
          <form action={submitOpportunity}>
            <input type="hidden" name="opportunityId" value={item.id} />
            <button className="button button-secondary" type="submit">Submit for review</button>
          </form>}
      </article>)}
    </div>}

    {!browseLock.locked && <section>
      <h2>Published opportunities</h2>
      {sectors.length > 1 && <form className="filter-row" method="get">
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
        <button className="button button-outline" type="submit">Filter</button>
      </form>}

      {(published ?? []).filter(o => o.owner_user_id !== profile.id).length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>No published opportunities yet</h2><p>New listings appear here as WTC Accra approves them.</p></section>
        : <div className="opportunity-list">{(published ?? []).filter(o => o.owner_user_id !== profile.id).map(item =>
            <article className="card opportunity-card" key={item.id}>
              <div className="opportunity-head">
                <div>
                  <span className="eyebrow">{labelForIntent(item.intent)} · {humanize(item.kind)}</span>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.sector} · {item.city ? `${item.city}, ` : ''}{item.country}{item.deadline ? ` · ${relativeDays(item.deadline)}` : ''}</p>
                </div>
                <div className="opportunity-figures">
                  <strong>{money(item.capital_required, item.currency)}</strong>
                  <span>{item.minimum_ticket ? `Min ${money(item.minimum_ticket, item.currency)}` : 'No minimum set'}</span>
                </div>
              </div>
              <p>{item.summary}</p>
              {item.tags.length > 0 && <div className="trust-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
              <form action={toggleSaved} className="save-row">
                <input type="hidden" name="opportunityId" value={item.id} />
                <input type="hidden" name="saved" value={savedIds.has(item.id) ? '1' : '0'} />
                <button className={savedIds.has(item.id) ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">{savedIds.has(item.id) ? '★ Saved to shortlist' : '☆ Save to shortlist'}</button>
              </form>
              <details className="eoi-block">
                <summary>{alreadyApplied.has(item.id) ? 'Interest already sent — send another note' : 'Express interest'}</summary>
                <form action={expressInterest} className="form-stack">
                  <input type="hidden" name="opportunityId" value={item.id} />
                  <label>Message to the owner<textarea name="message" rows={4} minLength={20} maxLength={3000} required placeholder="Introduce yourself and explain the fit." /></label>
                  <button className="button button-primary" type="submit">Send expression of interest</button>
                </form>
              </details>
              <p className="field-help">Published {date(item.published_at)}</p>
            </article>)}</div>}
    </section>}
  </div>
}
