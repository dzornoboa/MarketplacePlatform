'use client'

import { useEffect, useMemo, useState } from 'react'
import { selectableParticipantTypes, participantTypeLabels } from '@/lib/auth/access'
import { LanguageSelect } from '@/components/language-select'

const COMPANY_TYPES = new Set(['business', 'wtc_association_member', 'wtc_accra_member'])
const WTC_TYPES = new Set(['wtc_association_member', 'wtc_accra_member'])
const ID_TYPES = [
  ['national_id', 'National ID'],
  ['passport', 'Passport'],
  ['drivers_license', "Driver's Licence"],
  ['voter_id', 'Voter ID'],
  ['residence_permit', 'Residence Permit'],
  ['other', 'Other Government-Issued ID'],
] as const

const HINT: Record<string, string> = {
  investor: 'Individuals, funds and institutions deploying capital. Investment mandate, curated deal flow and managed introductions. US$1,750 a year.',
  business: 'Companies raising capital, sourcing suppliers or finding buyers and partners. Post opportunities, receive bids and open deal rooms. US$8,750 a year.',
  wtc_association_member: 'Members of the World Trade Centers Association network. WTC Accra confirms membership during verification. US$5,750 a year.',
  wtc_accra_member: 'Members of World Trade Centre Accra. WTC Accra confirms membership during verification. US$3,750 a year.',
}

type PlanOption = { code: string; name: string; price_usd: number; billing_interval: string; target_participant_types: string[]; description: string | null }
type CountryOption = { code: string; name: string; callingCode: string }

function suggestedUsername(name: string) {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 24)
  return base.length >= 3 ? base : ''
}

export function RegisterFields({ email, plans = [], initialPlan = '', initialType = '' }: { email?: string; plans?: PlanOption[]; initialPlan?: string; initialType?: string }) {
  const [type, setType] = useState(initialType)
  const [plan, setPlan] = useState(initialPlan)
  const [mail, setMail] = useState(email ?? '')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameState, setUsernameState] = useState<'idle'|'checking'|'available'|'taken'|'invalid'>('idle')
  const [dob, setDob] = useState('')
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [countryCode, setCountryCode] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/regions').then(r => r.json()).then((data: { countries?: CountryOption[] }) => {
      if (cancelled) return
      const list = data.countries ?? []
      setCountries(list)
      if (!countryCode && list.length) {
        const localeRegion = (navigator.language.match(/-([A-Z]{2})$/i)?.[1] ?? '').toUpperCase()
        const initial = list.find(c => c.code === localeRegion) ?? list.find(c => c.code === 'GH') ?? list[0]
        setCountryCode(initial.code)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [countryCode])

  useEffect(() => {
    if (!username) { setUsernameState('idle'); return }
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) { setUsernameState('invalid'); return }
    setUsernameState('checking')
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username?username=${encodeURIComponent(username)}`)
        const data = await response.json() as { available?: boolean; valid?: boolean }
        setUsernameState(data.valid === false ? 'invalid' : data.available ? 'available' : 'taken')
      } catch { setUsernameState('idle') }
    }, 350)
    return () => clearTimeout(timer)
  }, [username])

  const selectedCountry = useMemo(() => countries.find(c => c.code === countryCode) ?? null, [countries, countryCode])
  const age = (() => {
    if (!dob) return ''
    const birth = new Date(`${dob}T00:00:00Z`)
    if (Number.isNaN(birth.getTime())) return ''
    const now = new Date()
    let years = now.getUTCFullYear() - birth.getUTCFullYear()
    const month = now.getUTCMonth() - birth.getUTCMonth()
    if (month < 0 || (month === 0 && now.getUTCDate() < birth.getUTCDate())) years--
    return years >= 0 ? String(years) : ''
  })()

  const eligible = plans.filter(pl => pl.target_participant_types.length === 0 || (type && pl.target_participant_types.includes(type)))
  const chosen = eligible.find(pl => pl.code === plan) ?? null
  const pickType = (t: string) => {
    setType(t)
    if (!plans.find(pl => pl.code === plan && (pl.target_participant_types.length === 0 || pl.target_participant_types.includes(t)))) setPlan('')
  }
  const company = COMPANY_TYPES.has(type)
  const wtc = WTC_TYPES.has(type)
  const domain = mail.split('@')[1]?.toLowerCase() ?? ''
  const wtcWarn = wtc && mail.includes('@') && domain !== 'wtcaccra.com'

  const onName = (value: string) => {
    setFullName(value)
    if (!username || username === suggestedUsername(fullName)) setUsername(suggestedUsername(value))
  }

  const phoneDisplay = selectedCountry?.callingCode ?? ''

  return <>
    <label>Full Name<input name="fullName" autoComplete="name" required value={fullName} onChange={e => onName(e.target.value)} /></label>
    <label>Username
      <input name="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'))} minLength={3} maxLength={30} required />
    </label>
    <p className={`field-help username-state username-${usernameState}`}>
      {usernameState === 'available' ? '✓ Username Available' : usernameState === 'taken' ? 'That Username Is Already In Use. Try Another Suggestion.' : usernameState === 'checking' ? 'Checking Username…' : usernameState === 'invalid' ? 'Use 3–30 Lowercase Letters, Numbers, Dots, Hyphens Or Underscores.' : 'Your Username Is Unique Even When Another Member Has The Same Full Name.'}
    </p>

    <label>Email<input name="email" type="email" autoComplete="email" required value={mail} onChange={e => setMail(e.target.value)} pattern={wtc ? '.+@wtcaccra\\.com' : undefined} title={wtc ? 'WTC member accounts must use an @wtcaccra.com email address' : undefined} /></label>
    {wtcWarn && <p className="alert alert-error">{participantTypeLabels[type as keyof typeof participantTypeLabels]} accounts must register with an @wtcaccra.com address. {domain} will not be accepted.</p>}
    {wtc && !wtcWarn && <p className="field-help">WTC Accra membership will be checked during verification.</p>}

    <label>Account Type
      <select name="participantType" required value={type} onChange={e => pickType(e.target.value)}>
        <option value="" disabled>Select Account Type</option>
        {selectableParticipantTypes.map(t => <option key={t} value={t}>{participantTypeLabels[t]}</option>)}
      </select>
    </label>
    {type && <p className="field-help">{HINT[type]}</p>}
    {company && <label>Organisation Name<input name="organisationName" required placeholder="Registered Name" /></label>}
    {wtc && <div className="form-grid">
      <label>WTCA Membership Number<input name="wtcaMembershipNumber" placeholder="If You Have One" /></label>
      <label>WTC Chapter<input name="wtcaChapter" placeholder="e.g. WTC Accra" /></label>
    </div>}

    <div className="form-grid">
      <label>Country
        <select name="countryCode" required value={countryCode} onChange={e => setCountryCode(e.target.value)}>
          <option value="" disabled>Select Country</option>
          {countries.map(country => <option key={country.code} value={country.code}>{country.name}{country.callingCode ? ` (${country.callingCode})` : ''}</option>)}
        </select>
      </label>
      <label>Dashboard Language<LanguageSelect defaultValue="en" /></label>
    </div>
    <input type="hidden" name="country" value={selectedCountry?.name ?? ''} />
    <input type="hidden" name="phoneCountryCode" value={phoneDisplay} />
    <input type="hidden" name="locale" value={typeof navigator === 'undefined' ? 'en' : navigator.language} />
    <input type="hidden" name="timezone" value={typeof Intl === 'undefined' ? 'UTC' : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'} />

    <label>Telephone Number
      <div className="phone-field">
        <span className="phone-prefix">{phoneDisplay || '+'}</span>
        <input name="phoneLocal" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9 ()-]/g, ''))} placeholder="Phone Number" required />
      </div>
    </label>
    <p className="field-help">The international calling code follows your selected country automatically. Your number is saved in international format.</p>

    <div className="form-grid">
      <label>Date Of Birth<input name="dateOfBirth" type="date" autoComplete="bday" required value={dob} onChange={e => setDob(e.target.value)} /></label>
      <label>Age<input value={age} readOnly aria-label="Age calculated from date of birth" /></label>
    </div>
    <div className="form-grid">
      <label>Identification Type
        <select name="idType" required defaultValue="">
          <option value="" disabled>Select Identification Type</option>
          {ID_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>Identification Number<input name="idNumber" autoComplete="off" required minLength={3} maxLength={80} placeholder="Number On The Selected ID" /></label>
    </div>
    <p className="field-help">National ID means the official government-issued identity card for your country. Passport and other accepted government IDs are also supported worldwide. You must be at least 13 years old.</p>

    {type && eligible.length > 0 && <div className="form-stack plan-pick">
      <label>Plan
        <select name="planCode" value={plan} onChange={e => setPlan(e.target.value)} required>
          <option value="" disabled>Choose Your Plan</option>
          {eligible.map(pl => <option key={pl.code} value={pl.code}>{pl.name} — {Number(pl.price_usd) === 0 ? 'Free' : `US${Number(pl.price_usd).toLocaleString()}/${pl.billing_interval}`}</option>)}
        </select>
      </label>
      {chosen && <p className="field-help">{chosen.description ? chosen.description + ' ' : ''}{Number(chosen.price_usd) === 0 ? 'Free plan: browse the marketplace at once; upgrade to a paid plan to post listings.' : 'You pay after confirming your email; your account activates once payment is received.'}</p>}
    </div>}

    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    <p className="field-help">Use at least 8 characters with upper and lowercase letters and a number. Passwords are never stored in your registration draft.</p>
  </>
}
