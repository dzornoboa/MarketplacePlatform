import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { postingLock } from '@/lib/auth/access'
import { createOpportunity } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function NewOpportunityPage({ searchParams }: Props) {
  const { supabase } = await requireUserProfile()
  const state = await readAccessState(supabase)
  if (!state) redirect('/dashboard/opportunities')
  const lock = postingLock(state)
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
      <label>Title<input name="title" minLength={5} maxLength={180} required placeholder="Series A round for agri-processing facility" /></label>
      <label>Summary<textarea name="summary" rows={3} minLength={20} maxLength={700} required placeholder="One paragraph a reader can scan in the listing feed." /></label>
      <label>Full description<textarea name="description" rows={10} minLength={50} maxLength={12000} required placeholder="The opportunity, the counterparty profile you are looking for, use of funds, traction, and terms." /></label>
      <div className="form-grid">
        <label>Opportunity type
          <select name="kind" defaultValue="" required>
            <option value="" disabled>Select a type</option>
            <option value="investment">Investment</option>
            <option value="trade">Trade</option>
            <option value="procurement">Procurement</option>
            <option value="partnership">Partnership</option>
          </select>
        </label>
        <label>Sector<input name="sector" required placeholder="Agribusiness" /></label>
      </div>
      <div className="form-grid">
        <label>Country<input name="country" required defaultValue="Ghana" /></label>
        <label>City<input name="city" placeholder="Accra" /></label>
      </div>
      <div className="form-grid">
        <label>Capital required<input name="capitalRequired" type="number" min="0" step="1000" placeholder="2500000" /></label>
        <label>Minimum ticket<input name="minimumTicket" type="number" min="0" step="1000" placeholder="250000" /></label>
      </div>
      <div className="form-grid">
        <label>Currency<input name="currency" maxLength={3} defaultValue="USD" pattern="[A-Za-z]{3}" required /></label>
        <label>Deadline<input name="deadline" type="date" /></label>
      </div>
      <label>Tags<input name="tags" placeholder="processing, export, expansion" /></label>
      <p className="field-help">Comma separated, up to 12 tags.</p>
      <div className="button-row">
        <button className="button button-primary" type="submit">Save draft</button>
        <Link className="button button-outline" href="/dashboard/opportunities">Cancel</Link>
      </div>
    </form>
  </div>
}
