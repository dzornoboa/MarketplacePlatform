import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { readAccessState } from '@/lib/auth/guards'
import { humanize, labelForIntent, labelForParticipantType, marketplaceLockFor } from '@/lib/auth/access'
import { money, date, relativeDays } from '@/lib/format'
import { expressInterest, toggleSaved } from '@/app/dashboard/opportunities/actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function Stars({ rating }: { rating: number }) {
  return <span className="deal-rating" aria-label={`Deal rating ${rating} of 5`}>{'★'.repeat(rating)}<span className="deal-rating-dim">{'★'.repeat(5 - rating)}</span></span>
}

/* One listing. Three audiences:
   - anonymous: the teaser and a sign-in prompt (redirected to login with
     this page as the return address);
   - signed-in without marketplace access: the teaser plus exactly why the
     details are locked and what to do about it;
   - verified, subscribed member: the full listing and the bid form. */
export default async function ListingDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const query = await searchParams
  const error = typeof query.error === 'string' ? query.error : null
  const message = typeof query.message === 'string' ? query.message : null

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null
  if (!userId) redirect(`/login?next=${encodeURIComponent(`/opportunities/${id}`)}`)

  // Teaser is always available to a signed-in user; it confirms the listing exists.
  const anon = createPublicClient()
  const { data: teasers } = await anon.rpc('public_listing_teasers', { max_rows: 200 })
  const teaser = (teasers ?? []).find(t => t.id === id)
  if (!teaser) notFound()

  const [{ data: profile }, state] = await Promise.all([
    supabase.from('profiles').select('system_role,verification_status').eq('id', userId).single(),
    readAccessState(supabase),
  ])
  const lock = state ? marketplaceLockFor(state, profile?.system_role ?? 'user') : { locked: true as const, reason: 'Access state unavailable.', action: null }

  // RLS returns the row only if this member may see it; null means locked.
  const { data: full } = lock.locked ? { data: null } : await supabase.from('opportunities').select('*').eq('id', id).maybeSingle()
  const isOwner = full?.owner_user_id === userId

  const [{ data: owner }, { data: myBid }, { data: saved }] = full ? await Promise.all([
    supabase.rpc('listing_owner_cards', { owner_ids: [full.owner_user_id] }),
    supabase.from('expressions_of_interest').select('id,status,created_at').eq('opportunity_id', id).eq('applicant_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('saved_opportunities').select('opportunity_id').eq('opportunity_id', id).maybeSingle(),
  ]) : [{ data: null }, { data: null }, { data: null }]
  const ownerCard = owner?.[0]

  return <><PublicHeader /><main>
    <article className="section listing-detail">
      <p><Link className="arrow-link" href="/opportunities">← All live listings</Link></p>
      <div className="feed-meta">
        <span className="eyebrow">{labelForIntent(teaser.intent)}</span>
        <Stars rating={teaser.importance} />
      </div>
      <h1 className="article-title">{teaser.title}</h1>
      <p className="muted">{humanize(teaser.kind)} · {teaser.sector} · {teaser.country}{teaser.region ? ` · ${teaser.region}` : ''}{teaser.deadline ? ` · ${relativeDays(teaser.deadline)}` : ''}</p>
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!full && <>
        <p className="lede">{teaser.teaser}</p>
        <section className="restriction-banner">
          <div>
            <strong>The full listing is for verified, subscribed members</strong>
            <p>{lock.locked ? lock.reason : 'This listing is not available to your account.'}</p>
          </div>
          {lock.locked && lock.action && <Link className="button button-light" href={lock.action.href}>{lock.action.label}</Link>}
        </section>
        <section className="card">
          <h2>What members see</h2>
          <ul className="plain-list">
            <li>Capital required and minimum ticket</li>
            <li>The full description and use of funds</li>
            <li>Who posted it — organisation and participant type</li>
            <li>A bid form. Every bid goes to WTC Accra for due diligence before the owner sees it.</li>
          </ul>
        </section>
      </>}

      {full && <>
        <section className="split-grid">
          <div className="card">
            <h2>Summary</h2>
            <p>{full.summary}</p>
            <dl className="detail-grid detail-grid-two">
              <div><dt>Capital required</dt><dd>{money(full.capital_required, full.currency)}</dd></div>
              <div><dt>Minimum ticket</dt><dd>{money(full.minimum_ticket, full.currency)}</dd></div>
              <div><dt>Deadline</dt><dd>{date(full.deadline)}</dd></div>
              <div><dt>Location</dt><dd>{full.city ? `${full.city}, ` : ''}{full.country}</dd></div>
            </dl>
            {full.tags.length > 0 && <div className="trust-row">{full.tags.map(t => <span key={t}>{t}</span>)}</div>}
          </div>
          <div className="card">
            <h2>Posted by</h2>
            <div className="member-identity">
              <span className="member-avatar" aria-hidden="true">{(ownerCard?.organisation ?? ownerCard?.full_name ?? '?').charAt(0)}</span>
              <div>
                <strong>{ownerCard?.organisation ?? ownerCard?.full_name ?? 'Verified member'}</strong>
                <span className="member-role">{labelForParticipantType(ownerCard?.participant_type)}</span>
              </div>
            </div>
            <p className="field-help">{ownerCard?.country ?? ''}{isOwner ? ' · This is your listing.' : ''}</p>
            <p className="field-help">Published {date(full.published_at)} · Rated {full.importance}/5 by the WTC Accra trade desk.</p>
            {!isOwner && <form action={toggleSaved}>
              <input type="hidden" name="opportunityId" value={full.id} />
              <input type="hidden" name="saved" value={saved ? '1' : '0'} />
              <input type="hidden" name="returnTo" value={`/opportunities/${full.id}`} />
              <button className={saved ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">{saved ? '★ Saved to shortlist' : '☆ Save to shortlist'}</button>
            </form>}
          </div>
        </section>

        <section className="card">
          <h2>Full description</h2>
          <div className="prose">{full.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
        </section>

        {!isOwner && <section className="card bid-card">
          <h2>{myBid ? 'Your bid' : 'Place a bid'}</h2>
          {myBid
            ? <p className="muted">You bid on this listing on {date(myBid.created_at)}. Status: <span className={`status-dot status-eoi-${myBid.status}`}>{humanize(myBid.status)}</span>{myBid.status === 'submitted' ? ' — with WTC Accra for due diligence.' : myBid.status === 'under_review' ? ' — cleared, now with the owner.' : ''}</p>
            : <>
                <p className="muted">Your bid goes to WTC Accra first. The trade desk checks it, then clears it to the owner — and both of you are notified and copied. That keeps the deal on the platform.</p>
                <form action={expressInterest} className="form-stack">
                  <input type="hidden" name="opportunityId" value={full.id} />
                  <input type="hidden" name="returnTo" value={`/opportunities/${full.id}`} />
                  <label>Your bid<textarea name="message" rows={5} minLength={20} maxLength={3000} required placeholder="Who you are, what you are proposing, and on what terms." /></label>
                  <button className="button button-primary" type="submit">Submit bid for due diligence</button>
                </form>
              </>}
          <p className="field-help"><Link href="/dashboard/interests">Track all your bids →</Link></p>
        </section>}
      </>}
    </article>
  </main><PublicFooter /></>
}
