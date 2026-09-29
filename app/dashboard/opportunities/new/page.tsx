import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { redirect } from 'next/navigation'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { postingLockFor, listingIntents, listingIntentLabels, listingIntentHelp } from '@/lib/auth/access'
import { createOpportunity } from '../actions'
import { dealCategories } from '@/lib/deals/categories'
import { ListingFinancialFields } from '@/components/listing-financial-fields'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function NewOpportunityPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const state = await readAccessState(supabase)
  if (!state) redirect('/dashboard/opportunities')
  const lock = postingLockFor(state, profile.system_role)
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null

  if (lock.locked) {
    return <div className="page-stack narrow-content">
      <div><p className="eyebrow">Post an opportunity</p><h1>Posting is unavailable</h1></div>
      <section className="restriction-banner">
        <div><strong>You cannot post right now</strong><p>{lock.reason}</p></div>
        {lock.action && <Link className="button button-light" href={lock.action.href}>{lock.action.label}</Link>}
      </section>
    </div>
  }

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Post an opportunity</p>
      <h1>New listing</h1>
      <p className="muted">Saved as a draft first. WTC Accra reviews every listing before it becomes visible to subscribed members.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    <form action={createOpportunity} className="card form-stack">
      <fieldset className="intent-picker">
        <legend>What are you posting as?</legend>
        {listingIntents.map((value, index) => <label className="intent-option" key={value}>
          <input type="radio" name="intent" value={value} defaultChecked={index === 0} required />
          <span>
            <strong>{listingIntentLabels[value]}</strong>
            <small>{listingIntentHelp[value]}</small>
          </span>
        </label>)}
      </fieldset>
      <label>Title<input name="title" minLength={5} maxLength={180} required placeholder="Series A round for agri-processing facility" /></label>
      <label>Summary<textarea name="summary" rows={3} minLength={20} maxLength={700} required placeholder="One paragraph a reader can scan in the listing feed." /></label>
      <label>Full description<textarea name="description" rows={10} minLength={50} maxLength={12000} required placeholder="The opportunity, the counterparty profile you are looking for, use of funds, traction, and terms." /></label>
      <div className="form-grid">
        <label>Deal Category
          <select name="category" defaultValue="" required>
            <option value="" disabled>Select A Category</option>
            {dealCategories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>Opportunity Type
          <select name="kind" defaultValue="" required>
            <option value="" disabled>Select a type</option>
            <option value="investment">Investment</option>
            <option value="trade">Trade</option>
            <option value="procurement">Procurement</option>
            <option value="partnership">Partnership</option>
          </select>
        </label>
      </div>
      <label>Sector<input name="sector" required placeholder="Agribusiness" /></label>
      <ListingFinancialFields initialCountry="Ghana" initialCountryCode="GH" initialCurrency="USD" initialCity="Accra" />
      <label>Deadline<input name="deadline" type="date" /></label>
      <label>Tags<input name="tags" placeholder="processing, export, expansion" /></label>
      <p className="field-help">Comma separated, up to 12 tags. The selected category is automatically added as a searchable system tag.</p>
      <div className="button-row">
        <SubmitButton>Save draft</SubmitButton>
        <Link className="button button-outline" href="/dashboard/opportunities">Cancel</Link>
      </div>
    </form>
  </div>
}
