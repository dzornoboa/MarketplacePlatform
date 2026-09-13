import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { BrandCircle } from '@/components/brand'
import { createClient } from '@/lib/supabase/server'
import { humanize, labelForIntent, listingIntents, listingIntentLabels } from '@/lib/auth/access'
import { relativeDays } from '@/lib/format'
import { SessionCta } from '@/components/header-session'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Live listings',
  description: 'Investment, trade, procurement and partnership opportunities from verified WTC Accra members. Sign in to see the details and bid.',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

function Stars({ rating }: { rating: number }) {
  return <span className="deal-rating" aria-label={`Deal rating ${rating} of 5`}>{'★'.repeat(rating)}<span className="deal-rating-dim">{'★'.repeat(5 - rating)}</span></span>
}

/* The public shop window. Anonymous visitors see that opportunities exist —
   category, sector, market, WTC Accra rating and one line — but never the
   figures, the full description or who posted them. Everything here comes
   through public_listing_teasers(), so the table itself stays closed. */
export default async function PublicListingsPage({ searchParams }: Props) {
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : '')
  const kind = str('kind'), intent = str('intent'), sector = str('sector'), country = str('country')

  // Session-aware: the function returns real titles only to signed-in users.
  const supabase = await createClient()
  const [{ data: listings }, { data: facets }] = await Promise.all([
    supabase.rpc('public_listing_teasers', {
      listing_kind: kind || null, listing_intent: intent || null,
      listing_sector: sector || null, listing_country: country || null, max_rows: 60,
    }),
    supabase.rpc('public_listing_facets'),
  ])
  const facet = (name: string) => (facets ?? []).filter(f => f.facet === name)
  const filtered = !!(kind || intent || sector || country)

  return <><PublicHeader /><main>
    <section className="section">
      <div className="section-head">
        <p className="eyebrow">Private marketplace</p>
        <h2>Live <strong>listings</strong></h2>
        <p className="lede">Opportunities posted by verified WTC Accra members and reviewed by the trade desk. Sign in to see the full details, the figures and who is behind each one — and to bid.</p>
        <SessionCta memberHref="/dashboard/feed" memberLabel="Open your feed" />
      </div>

      <form className="filter-row card" method="get">
        <label>Posted as
          <select name="intent" defaultValue={intent}>
            <option value="">Any</option>
            {listingIntents.map(i => <option key={i} value={i}>{listingIntentLabels[i]}</option>)}
          </select>
        </label>
        <label>Category
          <select name="kind" defaultValue={kind}>
            <option value="">All categories</option>
            {facet('kind').map(f => <option key={f.value} value={f.value}>{humanize(f.value)} ({f.listings})</option>)}
          </select>
        </label>
        <label>Sector
          <select name="sector" defaultValue={sector}>
            <option value="">All sectors</option>
            {facet('sector').map(f => <option key={f.value} value={f.value}>{f.value} ({f.listings})</option>)}
          </select>
        </label>
        <label>Country
          <select name="country" defaultValue={country}>
            <option value="">All countries</option>
            {facet('country').map(f => <option key={f.value} value={f.value}>{f.value} ({f.listings})</option>)}
          </select>
        </label>
        <button className="button button-outline" type="submit">Filter</button>
        {filtered && <Link className="text-link" href="/opportunities">Reset</Link>}
      </form>

      {(listings ?? []).length === 0
        ? <section className="card empty-state">
            <BrandCircle />
            <h2>{filtered ? 'No listings match those filters' : 'No live listings yet'}</h2>
            <p>{filtered ? 'Try widening the filters.' : 'Listings appear here as WTC Accra reviews and publishes them.'}</p>
          </section>
        : <div className="article-grid">{(listings ?? []).map(item => <article className="card teaser-card" key={item.id}>
            <div className="feed-meta">
              <span className="eyebrow">{labelForIntent(item.intent)}</span>
              <Stars rating={item.importance} />
            </div>
            <h3 className={item.title_hidden ? 'teaser-title-hidden' : undefined}><Link href={`/opportunities/${item.id}`}>{item.title}</Link></h3>
            <p className="muted">{humanize(item.kind)} · {item.sector} · {item.country}{item.region ? ` · ${item.region}` : ''}</p>
            <p>{item.teaser}</p>
            {item.tags.length > 0 && <div className="trust-row">{item.tags.slice(0, 4).map(t => <span key={t}>{t}</span>)}</div>}
            <div className="teaser-foot">
              <span className="field-help">{item.deadline ? relativeDays(item.deadline) : 'Open'}</span>
              <Link className="arrow-link" href={`/opportunities/${item.id}`}>{item.title_hidden ? 'Sign in to see this deal →' : 'View details →'}</Link>
            </div>
          </article>)}</div>}
    </section>
  </main><PublicFooter /></>
}
