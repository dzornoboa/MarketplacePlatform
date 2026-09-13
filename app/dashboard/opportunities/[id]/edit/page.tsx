import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { notFound, redirect } from 'next/navigation'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize, listingIntents, listingIntentLabels, listingIntentHelp } from '@/lib/auth/access'
import { updateOpportunity } from '../../actions'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const EDITABLE = new Set(['draft', 'changes_requested'])

export default async function EditOpportunityPage({ params, searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const { id } = await params
  const search = await searchParams
  const error = typeof search.error === 'string' ? search.error : null

  const { data: item } = await supabase.from('opportunities').select('*').eq('id', id).maybeSingle()
  if (!item) notFound()
  if (item.owner_user_id !== profile.id) redirect(`/dashboard/opportunities/${id}`)

  /* Once a listing is submitted or published it is frozen — the database says
     the same thing, so showing an editable form here would only fail on save. */
  if (!EDITABLE.has(item.status)) {
    return <div className="page-stack narrow-content">
      <div><p className="eyebrow">Edit listing</p><h1>{item.title}</h1></div>
      <section className="restriction-banner">
        <div>
          <strong>This listing cannot be edited right now</strong>
          <p>It is currently {humanize(item.status)}. Listings can only be changed while they are a draft or when WTC Accra has requested changes.</p>
        </div>
        <Link className="button button-light" href={`/dashboard/opportunities/${id}`}>View listing</Link>
      </section>
    </div>
  }

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Edit listing</p>
      <h1>{item.title}</h1>
      <p className="muted">{humanize(item.status)}. Changes are saved as a draft until you resubmit for review.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {item.review_note && <div className="alert alert-error">Reviewer note: {item.review_note}</div>}

    <form action={updateOpportunity} className="card form-stack">
      <input type="hidden" name="opportunityId" value={item.id} />

      <fieldset className="intent-picker">
        <legend>What are you posting as?</legend>
        {listingIntents.map(value => <label className="intent-option" key={value}>
          <input type="radio" name="intent" value={value} defaultChecked={item.intent === value} required />
          <span><strong>{listingIntentLabels[value]}</strong><small>{listingIntentHelp[value]}</small></span>
        </label>)}
      </fieldset>

      <label>Title<input name="title" defaultValue={item.title} minLength={5} maxLength={180} required /></label>
      <label>Summary<textarea name="summary" rows={3} defaultValue={item.summary} minLength={20} maxLength={700} required /></label>
      <label>Full description<textarea name="description" rows={12} defaultValue={item.description} minLength={50} maxLength={12000} required /></label>

      <div className="form-grid">
        <label>Opportunity type
          <select name="kind" defaultValue={item.kind} required>
            <option value="investment">Investment</option>
            <option value="trade">Trade</option>
            <option value="procurement">Procurement</option>
            <option value="partnership">Partnership</option>
          </select>
        </label>
        <label>Sector<input name="sector" defaultValue={item.sector} required /></label>
      </div>
      <div className="form-grid">
        <label>Country<input name="country" defaultValue={item.country} required /></label>
        <label>City<input name="city" defaultValue={item.city ?? ''} /></label>
      </div>
      <label>Region<input name="region" defaultValue={item.region ?? ''} placeholder="West Africa" /></label>
      <div className="form-grid">
        <label>Capital required<input name="capitalRequired" type="number" min="0" step="1000" defaultValue={item.capital_required ?? ''} /></label>
        <label>Minimum ticket<input name="minimumTicket" type="number" min="0" step="1000" defaultValue={item.minimum_ticket ?? ''} /></label>
      </div>
      <div className="form-grid">
        <label>Currency<input name="currency" maxLength={3} pattern="[A-Za-z]{3}" defaultValue={item.currency} required /></label>
        <label>Deadline<input name="deadline" type="date" defaultValue={item.deadline ?? ''} /></label>
      </div>
      <label>Tags<input name="tags" defaultValue={item.tags.join(', ')} /></label>
      <p className="field-help">The deal rating and publication status are set by the WTC Accra trade desk and cannot be changed here.</p>

      <div className="button-row">
        <SubmitButton>Save changes</SubmitButton>
        <Link className="button button-outline" href={`/dashboard/opportunities/${id}`}>Cancel</Link>
      </div>
    </form>
  </div>
}
