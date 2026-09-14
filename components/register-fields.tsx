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
export function RegisterFields({ email }: { email?: string }) {
  const [type, setType] = useState('')
  const [mail, setMail] = useState(email ?? '')
  const company = COMPANY_TYPES.has(type), wtc = WTC_TYPES.has(type)
  const domain = mail.split('@')[1]?.toLowerCase() ?? ''
  const wtcWarn = wtc && mail.includes('@') && domain !== 'wtcaccra.com'

  return <>
    <label>Full name<input name="fullName" autoComplete="name" required /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required value={mail} onChange={e => setMail(e.target.value)} pattern={wtc ? '.+@wtcaccra\\.com' : undefined} title={wtc ? 'WTC member accounts must use an @wtcaccra.com email address' : undefined} /></label>
    {wtcWarn && <p className="alert alert-error">{participantTypeLabels[type as keyof typeof participantTypeLabels]} accounts must register with an @wtcaccra.com address. {domain} will not be accepted.</p>}
    {wtc && !wtcWarn && <p className="field-help">A verification code will be sent to this address; the account is only created once you enter it.</p>}
    <label>Account type
      <select name="participantType" required value={type} onChange={e => setType(e.target.value)}>
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
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    <p className="field-help">Use at least 8 characters with upper and lowercase letters and a number.</p>
  </>
}
