import Link from 'next/link'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize, labelForIntent } from '@/lib/auth/access'
import { money, date, relativeDays } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { toggleSaved } from '../opportunities/actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SavedPage({ searchParams }: Props) {
  const { supabase } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const { data: savedRows } = await supabase.from('saved_opportunities')
    .select('opportunity_id,created_at').order('created_at', { ascending: false })
  const ids = (savedRows ?? []).map(r => r.opportunity_id)

  /* RLS still applies: a listing that was unpublished, or that you lost access
     to, simply stops coming back — the shortlist row is harmless on its own. */
  const { data: listings } = ids.length
    ? await supabase.from('opportunities').select('*').in('id', ids)
    : { data: [] }
  const byId = new Map((listings ?? []).map(o => [o.id, o]))
  const savedAt = new Map((savedRows ?? []).map(r => [r.opportunity_id, r.created_at]))
  const visible = ids.map(id => byId.get(id)).filter((o): o is NonNullable<typeof o> => !!o)
  const unavailable = ids.length - visible.length

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Your shortlist</p>
      <h1>Saved opportunities</h1>
      <p className="muted">A private list only you can see. Saving does not notify the poster.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {visible.length === 0
      ? <section className="card empty-state">
          <BrandCircle />
          <h2>Nothing saved yet</h2>
          <p>Save a listing from your home feed and it will wait for you here.</p>
          <Link className="button button-primary" href="/dashboard/feed">Open your feed</Link>
        </section>
      : <div className="opportunity-list">{visible.map(item => <article className="card opportunity-card" key={item.id}>
          <div className="opportunity-head">
            <div>
              <span className="eyebrow">{labelForIntent(item.intent)} · {humanize(item.kind)}</span>
              <h3><Link href={`/dashboard/opportunities/${item.id}`}>{item.title}</Link></h3>
              <p className="muted">
                {item.sector} · {item.city ? `${item.city}, ` : ''}{item.country}
                {item.deadline ? ` · ${relativeDays(item.deadline)}` : ''} · saved {date(savedAt.get(item.id))}
              </p>
            </div>
            <div className="opportunity-figures">
              <strong>{money(item.capital_required, item.currency)}</strong>
              <span>{item.minimum_ticket ? `Min ${money(item.minimum_ticket, item.currency)}` : humanize(item.kind)}</span>
            </div>
          </div>
          <p>{item.summary}</p>
          <div className="button-row">
            <Link className="button button-outline" href={`/dashboard/opportunities/${item.id}`}>View listing</Link>
            <form action={toggleSaved}>
              <input type="hidden" name="opportunityId" value={item.id} />
              <input type="hidden" name="saved" value="1" />
              <input type="hidden" name="returnTo" value="/dashboard/saved" />
              <button className="save-toggle save-toggle-on" type="submit">★ Remove from shortlist</button>
            </form>
          </div>
        </article>)}</div>}

    {unavailable > 0 && <p className="field-help">{unavailable} saved {unavailable === 1 ? 'listing is' : 'listings are'} no longer available to you — they may have been unpublished or closed.</p>}
  </div>
}
