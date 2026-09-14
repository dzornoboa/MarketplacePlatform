'use client'

import { useState } from 'react'
import { selectableParticipantTypes, participantTypeLabels } from '@/lib/auth/access'

const COMPANY_TYPES = new Set(['business', 'project_sponsor', 'institutional_partner', 'wtc_association_member', 'wtc_accra_member'])
const WTC_TYPES = new Set(['wtc_association_member', 'wtc_accra_member'])
const HINT: Record<string, string> = {
  investor: 'Browse and bid on vetted opportunities. A free Verified Investor Basic plan is available after verification.',
  buyer: 'Source verified suppliers and post buying requirements. Plans start at US$350 a year.',
  business: 'Raise capital, find buyers and partners. Upload your business registration certificate for verification.',
  project_sponsor: 'Present projects to investors. Upload your registration certificate and project documents.',
  wtc_accra_member: 'For WTC Accra members. Registration must use your @wtcaccra.com email address; WTC Accra confirms membership.',
  wtc_association_member: 'For WTCA network members. Registration must use your @wtcaccra.com email address; WTC Accra confirms membership.',
  institutional_partner: 'Institutions, chambers, embassies, government agencies and DFIs. A verified organisation is required.',
}

/* The account-type choice drives the rest of the form: companies and
   institutions give an organisation name, WTC members their membership
   details, and each type sees what verification will ask for. */
type PlanOption = { code: string; name: string; price_usd: number; billing_interval: string; target_participant_types: string[]; description: string | null }

export function RegisterFields({ email, plans = [], initialPlan = '', initialType = '' }: { email?: string; plans?: PlanOption[]; initialPlan?: string; initialType?: string }) {
  const [type, setType] = useState(initialType)
  const [plan, setPlan] = useState(initialPlan)
  const [mail, setMail] = useState(email ?? '')
  const eligible = plans.filter(pl => pl.target_participant_types.length === 0 || (type && pl.target_participant_types.includes(type)))
  const chosen = eligible.find(pl => pl.code === plan) ?? null
  const pickType = (t: string) => { setType(t); if (!plans.find(pl => pl.code === plan && (pl.target_participant_types.length === 0 || pl.target_participant_types.includes(t)))) setPlan('') }
  const company = COMPANY_TYPES.has(type), wtc = WTC_TYPES.has(type)
  const domain = mail.split('@')[1]?.toLowerCase() ?? ''
  const wtcWarn = wtc && mail.includes('@') && domain !== 'wtcaccra.com'

  return <>
    <label>Full name<input name="fullName" autoComplete="name" required /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required value={mail} onChange={e => setMail(e.target.value)} pattern={wtc ? '.+@wtcaccra\\.com' : undefined} title={wtc ? 'WTC member accounts must use an @wtcaccra.com email address' : undefined} /></label>
    {wtcWarn && <p className="alert alert-error">{participantTypeLabels[type as keyof typeof participantTypeLabels]} accounts must register with an @wtcaccra.com address. {domain} will not be accepted.</p>}
    {wtc && !wtcWarn && <p className="field-help">A verification code will be sent to this address; the account is only created once you enter it.</p>}
    <label>Account type
      <select name="participantType" required value={type} onChange={e => pickType(e.target.value)}>
        <option value="" disabled>Select account type</option>
        {selectableParticipantTypes.map(t => <option key={t} value={t}>{participantTypeLabels[t]}</option>)}
      </select>
    </label>
    {type && <p className="field-help">{HINT[type]}</p>}
    {company && <label>{type === 'institutional_partner' ? 'Institution / agency name' : 'Company name'}<input name="organisationName" required placeholder="Registered name" /></label>}
    {wtc && <div className="form-grid">
      <label>WTCA membership number<input name="wtcaMembershipNumber" placeholder="If you have one" /></label>
      <label>WTC chapter<input name="wtcaChapter" placeholder="e.g. WTC Accra" /></label>
    </div>}
    <div className="form-grid">
      <label>Phone<input name="phone" autoComplete="tel" placeholder="+233 …" /></label>
      <label>Country<input name="country" autoComplete="country-name" defaultValue="Ghana" /></label>
    </div>
    {type && eligible.length > 0 && <div className="form-stack plan-pick">
      <label>Plan
        <select name="planCode" value={plan} onChange={e => setPlan(e.target.value)} required>
          <option value="" disabled>Choose your plan</option>
          {eligible.map(pl => <option key={pl.code} value={pl.code}>{pl.name} — {Number(pl.price_usd) === 0 ? 'Free' : `US${Number(pl.price_usd).toLocaleString()}/${pl.billing_interval}`}</option>)}
        </select>
      </label>
      {chosen && <p className="field-help">{chosen.description ? chosen.description + ' ' : ''}{Number(chosen.price_usd) === 0 ? 'Free plan: browse the marketplace at once; upgrade to a paid plan to post listings.' : 'You pay after confirming your email; your account activates once payment is received.'}</p>}
    </div>}
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    <p className="field-help">Use at least 8 characters with upper and lowercase letters and a number.</p>
  </>
}
