import Link from 'next/link'
import { Avatar } from '@/components/avatar'
import { notFound } from 'next/navigation'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { marketplaceLockFor, humanize, labelForIntent, labelForParticipantType } from '@/lib/auth/access'
import { money, date, dateTime, relativeDays } from '@/lib/format'
import { submitOpportunity, expressInterest, toggleSaved, withdrawOpportunity, deleteOpportunity } from '../actions'
import { SubmitButton } from '@/components/submit-button'
import { requestConnection, toggleFollow } from '../../feed/actions'
import { openDocument } from '../../documents/actions'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OpportunityDetailPage({ params, searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const { id } = await params
  const search = await searchParams
  const error = typeof search.error === 'string' ? search.error : null
  const message = typeof search.message === 'string' ? search.message : null

  /* RLS decides visibility: the owner sees any status, everyone else needs
     marketplace access and a published listing. A miss is a genuine 404. */
  const { data: item } = await supabase.from('opportunities').select('*').eq('id', id).maybeSingle()
  if (!item) notFound()

  const isOwner = item.owner_user_id === profile.id
  const state = await readAccessState(supabase)
  const lock = state ? marketplaceLockFor(state, profile.system_role) : { locked: true as const, reason: '', action: null }

  const [{ data: owners }, { data: savedRows }, { data: followRows }, { data: documents }, { data: myInterest }] = await Promise.all([
    isOwner ? Promise.resolve({ data: [] }) : supabase.rpc('listing_owner_cards', { owner_ids: [item.owner_user_id] }),
    supabase.from('saved_opportunities').select('opportunity_id').eq('opportunity_id', id),
    supabase.from('follows').select('following_id').eq('following_id', item.owner_user_id),
    supabase.from('document_records').select('*').eq('opportunity_id', id),
    supabase.from('expressions_of_interest').select('id,status').eq('opportunity_id', id).eq('applicant_id', profile.id).maybeSingle(),
  ])

  const owner = (owners ?? [])[0]
  const saved = (savedRows ?? []).length > 0
  const following = (followRows ?? []).length > 0
  const paragraphs = item.description.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)

  return <div className="page-stack narrow-content">
    <Link className="arrow-link" href={isOwner ? '/dashboard/opportunities' : '/dashboard/feed'}>← Back</Link>

    <div>
      <div className="feed-meta">
        <span className="eyebrow">{labelForIntent(item.intent)} · {humanize(item.kind)}</span>
        <span className="deal-rating" aria-label={`Deal rating ${item.importance} of 5`}>
          {'★'.repeat(item.importance)}<span className="deal-rating-dim">{'★'.repeat(5 - item.importance)}</span>
        </span>
        {isOwner && <span className={`status-dot status-opp-${item.status}`}>{humanize(item.status)}</span>}
      </div>
      <h1>{item.title}</h1>
      <p className="muted">
        {item.sector} · {item.city ? `${item.city}, ` : ''}{item.country}{item.region ? ` · ${item.region}` : ''}
        {item.deadline ? ` · ${relativeDays(item.deadline)}` : ''}
      </p>
    </div>

    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {isOwner && item.review_note && <section className="restriction-banner">
      <div><strong>WTC Accra requested changes</strong><p>{item.review_note}</p></div>
      <Link className="button button-light" href={`/dashboard/opportunities/${item.id}/edit`}>Edit listing</Link>
    </section>}

    <section className="card">
      <dl className="detail-grid">
        <div><dt>Capital required</dt><dd>{money(item.capital_required, item.currency)}</dd></div>
        <div><dt>Minimum ticket</dt><dd>{money(item.minimum_ticket, item.currency)}</dd></div>
        <div><dt>Deadline</dt><dd>{date(item.deadline)}</dd></div>
        <div><dt>Published</dt><dd>{date(item.published_at)}</dd></div>
      </dl>
      <p className="lede">{item.summary}</p>
      {item.tags.length > 0 && <div className="trust-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
    </section>

    <section className="card">
      <h2>Full description</h2>
      <div className="prose">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    </section>

    {(documents ?? []).length > 0 && <section className="card">
      <h2>Documents</h2>
      <div className="history-list">{(documents ?? []).map(doc => <div key={doc.id}>
        <strong>{doc.file_name}</strong>
        <span>{dateTime(doc.created_at)}</span>
        <form action={openDocument}>
          <input type="hidden" name="documentId" value={doc.id} />
          <button className="button button-outline" type="submit">Open</button>
        </form>
      </div>)}</div>
      <p className="field-help">Links are signed and expire after two minutes.</p>
    </section>}

    {isOwner
      ? <section className="card listing-head">
          <div><h2>Manage this listing</h2><p className="muted">{humanize(item.status)}</p></div>
          <div className="button-row">
            {['draft', 'changes_requested', 'rejected'].includes(item.status) && <Link className="button button-secondary" href={`/dashboard/opportunities/${item.id}/edit`}>Edit</Link>}
            {(item.status === 'draft' || item.status === 'changes_requested') &&
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
        </section>
      : !lock.locked && <section className="card">
          <h2>About the poster</h2>
          {owner && <div className="owner-card"><Avatar src={owner.avatar_url} name={owner.full_name} size={48} /><div><strong>{owner.full_name}</strong><p className="muted">{owner.organisation ? `${owner.organisation} · ` : ''}{labelForParticipantType(owner.participant_type)}{owner.country ? ` · ${owner.country}` : ''}</p></div></div>}
          <div className="feed-actions">
            <div className="button-row">
              <form action={toggleSaved}>
                <input type="hidden" name="opportunityId" value={item.id} />
                <input type="hidden" name="saved" value={saved ? '1' : '0'} />
                <input type="hidden" name="returnTo" value={`/dashboard/opportunities/${item.id}`} />
                <button className={saved ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">{saved ? '★ Saved' : '☆ Save to shortlist'}</button>
              </form>
              <form action={toggleFollow}>
                <input type="hidden" name="target" value={item.owner_user_id} />
                <input type="hidden" name="returnTo" value={`/dashboard/opportunities/${item.id}`} />
                <button className={following ? 'save-toggle save-toggle-on' : 'save-toggle'} type="submit">{following ? '✓ Following' : '+ Follow'}</button>
              </form>
            </div>

            <details className="eoi-block connect-block">
              <summary>Connect about this listing</summary>
              <form action={requestConnection} className="form-stack">
                <input type="hidden" name="addressee" value={item.owner_user_id} />
                <input type="hidden" name="opportunityId" value={item.id} />
                <input type="hidden" name="returnTo" value={`/dashboard/opportunities/${item.id}`} />
                <label>Request type
                  <select name="intent" defaultValue={item.intent === 'seeking_investment' ? 'invest' : 'connect'}>
                    <option value="invest">I want to invest</option>
                    <option value="buy">I want to buy</option>
                    <option value="partner">I want to partner</option>
                    <option value="connect">Just connect</option>
                  </select>
                </label>
                <label>Message<textarea name="note" rows={3} maxLength={2000} /></label>
                <p className="field-help">WTC Accra is copied on every request, with this deal and the process attached.</p>
                <button className="button button-primary" type="submit">Send request</button>
              </form>
            </details>

            <details className="eoi-block">
              <summary>{myInterest ? `Interest already sent (${humanize(myInterest.status)}) — send another note` : 'Express interest'}</summary>
              <form action={expressInterest} className="form-stack">
                <input type="hidden" name="opportunityId" value={item.id} />
                <label>Message to the owner<textarea name="message" rows={4} minLength={20} maxLength={3000} required /></label>
                <button className="button button-secondary" type="submit">Send expression of interest</button>
              </form>
            </details>
          </div>
        </section>}
  </div>
}
