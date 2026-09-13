import Link from 'next/link'
import { requireUserProfile } from '@/lib/auth/guards'
import { labelForParticipantType } from '@/lib/auth/access'
import { money } from '@/lib/format'
import { saveMandate, saveRequirement } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function MandatePage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const [{ data: mandates }, { data: requirements }] = await Promise.all([
    supabase.from('investor_mandates').select('*').order('created_at', { ascending: false }).limit(1),
    supabase.from('buyer_requirements').select('*').order('created_at', { ascending: false }).limit(1),
  ])
  const mandate = mandates?.[0]
  const requirement = requirements?.[0]
  const type = profile.participant_type
  const canInvest = type === 'investor' || type === 'institutional_partner'
  const canBuy = type === 'buyer' || type === 'institutional_partner'

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Matching</p>
      <h1>Your mandate and requirements</h1>
      <p className="muted">Tell the WTC Accra trade desk what you are looking for. Matches are made by people using what you record here — nothing is published to other members.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {!canInvest && !canBuy && <section className="restriction-banner">
      <div>
        <strong>Mandates are recorded by investors and buyers</strong>
        <p>Your participant type is {labelForParticipantType(type)}. Investors record an investment mandate; buyers record a buying requirement. Both are used by the WTC Accra trade desk to match you — if your role should include one of these, ask WTC Accra to review your participant type.</p>
      </div>
      <Link className="button button-light" href="/dashboard/verification">Open verification</Link>
    </section>}

    {canInvest && <section className="card">
      <h2>Investment mandate</h2>
      <p className="muted">For investors and institutions deploying capital.</p>
      <form action={saveMandate} className="form-stack">
        {mandate && <input type="hidden" name="mandateId" value={mandate.id} />}
        <label>Mandate title<input name="title" defaultValue={mandate?.title ?? ''} placeholder="West Africa growth capital" minLength={3} required /></label>
        <label>Sectors<input name="sectors" defaultValue={(mandate?.sectors ?? []).join(', ')} placeholder="Agribusiness, logistics, fintech" /></label>
        <label>Geographies<input name="geographies" defaultValue={(mandate?.geographies ?? []).join(', ')} placeholder="Ghana, Nigeria, Côte d'Ivoire" /></label>
        <p className="field-help">Comma separated, up to 15 entries each.</p>
        <div className="form-grid">
          <label>Minimum ticket<input name="ticketMin" type="number" min="0" step="1000" defaultValue={mandate?.ticket_min ?? ''} /></label>
          <label>Maximum ticket<input name="ticketMax" type="number" min="0" step="1000" defaultValue={mandate?.ticket_max ?? ''} /></label>
        </div>
        <label>Currency<input name="currency" maxLength={3} pattern="[A-Za-z]{3}" defaultValue={mandate?.currency ?? 'USD'} required /></label>
        <label>Notes for the trade desk<textarea name="notes" rows={4} defaultValue={mandate?.notes ?? ''} placeholder="Stage, structure, exclusions, board requirements." /></label>
        <label className="switch"><input type="checkbox" name="active" defaultChecked={mandate?.active ?? true} /> Actively looking</label>
        <button className="button button-primary" type="submit">{mandate ? 'Save mandate' : 'Create mandate'}</button>
      </form>
      {mandate && <p className="field-help">Current range: {money(mandate.ticket_min, mandate.currency)} – {money(mandate.ticket_max, mandate.currency)}</p>}
    </section>}

    {canBuy && <section className="card">
      <h2>Buying requirement</h2>
      <p className="muted">For buyers sourcing goods, services or suppliers through the network.</p>
      <form action={saveRequirement} className="form-stack">
        {requirement && <input type="hidden" name="requirementId" value={requirement.id} />}
        <label>Requirement title<input name="title" defaultValue={requirement?.title ?? ''} placeholder="Annual cocoa derivative supply" minLength={3} required /></label>
        <label>What you are sourcing<textarea name="requirement" rows={4} defaultValue={requirement?.requirement ?? ''} minLength={10} required placeholder="Specification, volume, certification and delivery expectations." /></label>
        <label>Sectors<input name="sectors" defaultValue={(requirement?.sectors ?? []).join(', ')} /></label>
        <label>Geographies<input name="geographies" defaultValue={(requirement?.geographies ?? []).join(', ')} /></label>
        <div className="form-grid">
          <label>Minimum budget<input name="budgetMin" type="number" min="0" step="1000" defaultValue={requirement?.budget_min ?? ''} /></label>
          <label>Maximum budget<input name="budgetMax" type="number" min="0" step="1000" defaultValue={requirement?.budget_max ?? ''} /></label>
        </div>
        <label>Currency<input name="currency" maxLength={3} pattern="[A-Za-z]{3}" defaultValue={requirement?.currency ?? 'USD'} required /></label>
        <label className="switch"><input type="checkbox" name="active" defaultChecked={requirement?.active ?? true} /> Actively sourcing</label>
        <button className="button button-secondary" type="submit">{requirement ? 'Save requirement' : 'Create requirement'}</button>
      </form>
    </section>}
  </div>
}
