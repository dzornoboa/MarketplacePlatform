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
  investor: 'Investors join and post deals for free. Deal and business details stay protected until access is requested and approved. A 1% success fee applies to successfully closed deals.',
  business: 'Businesses join and post deals for free. US$1,000/year unlocks restricted deal details and networking after the profile is completed and verified. A 1% success fee applies to successful requested deals.',
  wtc_association_member: 'World Trade Centers Association members require an activated WTCAM Member ID issued to their email address. They join and post deals for free; US$1,500/year unlocks investors, opportunities and restricted deal details after verification. A 1% success fee applies to closed deals.',
  wtc_accra_member: 'WTC Accra members require an activated WTCA Membership ID issued to their email address. They join and post deals for free; US$500/year unlocks meeting details and restricted deal opportunities. A 1% success fee applies to closed deals.',
}

type CountryOption = { code: string; name: string; callingCode: string; currencyCode: string; currencyName: string; currencySymbol: string }
type CurrencyOption = { code: string; name: string; symbol: string }

function suggestedUsername(name: string) {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 24)
  return base.length >= 3 ? base : ''
}

export function RegisterFields({ email, initialPlan = '', initialType = '' }: { email?: string; plans?: unknown[]; initialPlan?: string; initialType?: string }) {
  const [type, setType] = useState(initialType)
  const [mail, setMail] = useState(email ?? '')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameState, setUsernameState] = useState<'idle'|'checking'|'available'|'taken'|'invalid'>('idle')
  const [dob, setDob] = useState('')
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [countryCode, setCountryCode] = useState('')
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
  const [preferredCurrency, setPreferredCurrency] = useState('USD')
  const [currencyTouched, setCurrencyTouched] = useState(false)
  const [countryTouched, setCountryTouched] = useState(false)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/regions').then(r => r.json()).then((data: { countries?: CountryOption[]; currencies?: CurrencyOption[] }) => {
      if (cancelled) return
      const list = data.countries ?? []
      setCountries(list)
      setCurrencies(data.currencies ?? [])
      if (!countryCode && list.length) {
        const localeRegion = (navigator.language.match(/-([A-Z]{2})$/i)?.[1] ?? '').toUpperCase()
        const initial = list.find(c => c.code === localeRegion) ?? list.find(c => c.code === 'GH') ?? list[0]
        setCountryCode(initial.code)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

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

  useEffect(() => {
    if (!selectedCountry || currencyTouched || !countryTouched) return
    setPreferredCurrency(selectedCountry.currencyCode || 'USD')
  }, [selectedCountry?.code, countryTouched, currencyTouched])
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

  const pickType = (t: string) => setType(t)
  const company = COMPANY_TYPES.has(type)
  const wtc = WTC_TYPES.has(type)
  const wtcAccra = type === 'wtc_accra_member'
  const wtcaNetwork = type === 'wtc_association_member'

  const onName = (value: string) => {
    setFullName(value)
    if (!username || username === suggestedUsername(fullName)) setUsername(suggestedUsername(value))
  }

  const phoneDisplay = selectedCountry?.callingCode ?? ''

  return <>
    <div className="form-grid">
      <label>Date Of Birth<input name="dateOfBirth" type="date" autoComplete="bday" required max={new Date(Date.UTC(new Date().getUTCFullYear() - 18, new Date().getUTCMonth(), new Date().getUTCDate())).toISOString().slice(0,10)} value={dob} onChange={e => setDob(e.target.value)} /></label>
      <label>Age<input value={age} readOnly aria-label="Age calculated from date of birth" /></label>
    </div>
    {!dob
      ? <p className="field-help">Enter your date of birth first. Registration is strictly limited to users aged 18 or older.</p>
      : Number(age) < 18
        ? <div className="alert alert-error">Registration is only available to users aged 18 or older. Account creation has been stopped.</div>
        : <>
    <label>Full Name<input name="fullName" autoComplete="name" required value={fullName} onChange={e => onName(e.target.value)} /></label>
    <label>Username
      <input name="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'))} minLength={3} maxLength={30} required />
    </label>
    <p className={`field-help username-state username-${usernameState}`}>
      {usernameState === 'available' ? '✓ Username Available' : usernameState === 'taken' ? 'That Username Is Already In Use. Try Another Suggestion.' : usernameState === 'checking' ? 'Checking Username…' : usernameState === 'invalid' ? 'Use 3–30 Lowercase Letters, Numbers, Dots, Hyphens Or Underscores.' : 'Your Username Is Unique Even When Another Member Has The Same Full Name.'}
    </p>

    <label>Email<input name="email" type="email" autoComplete="email" required value={mail} onChange={e => setMail(e.target.value)} /></label>
    {wtc && <p className="field-help">Use an email address you can access. WTC membership or chapter affiliation is checked during verification, so international WTC members are supported.</p>}

    <label>Account Type
      <select name="participantType" required value={type} onChange={e => pickType(e.target.value)}>
        <option value="" disabled>Select Account Type</option>
        {selectableParticipantTypes.map(t => <option key={t} value={t}>{participantTypeLabels[t]}</option>)}
      </select>
    </label>
    {type && <p className="field-help">{HINT[type]}</p>}
    {company && <label>Organisation Name<input name="organisationName" required placeholder="Registered Name" /></label>}
    {wtcAccra && <div className="form-stack membership-id-gate">
      <label>WTC Accra Membership ID
        <input name="membershipAccessId" required pattern="WTCA[0-9]{10}" placeholder="WTCA4567679989" autoComplete="off" />
      </label>
      <p className="field-help">This ID must have been generated and activated by WTC Accra for the same email address. Random or unactivated IDs cannot create an account. Membership IDs are issued through WTC Accra at wtcaccra.com.</p>
    </div>}
    {wtcaNetwork && <div className="form-stack membership-id-gate">
      <label>WTCA Member ID
        <input name="membershipAccessId" required pattern="WTCAM[0-9]{10}" placeholder="WTCAM7856574110" autoComplete="off" />
      </label>
      <p className="field-help">World Trade Centers Association Member accounts require a WTCAM Membership ID issued and activated by WTC Accra for this email address.</p>
      <div className="form-grid">
        <label>Existing WTCA / WTC Membership Number<input name="wtcaMembershipNumber" placeholder="Optional Existing Number" /></label>
        <label>WTC Chapter<input name="wtcaChapter" placeholder="e.g. WTC Accra" /></label>
      </div>
    </div>}

    <div className="form-grid">
      <label>Country
        <select name="countryCode" required value={countryCode} onChange={e => { setCountryTouched(true); setCurrencyTouched(false); setCountryCode(e.target.value) }}>
          <option value="" disabled>Select Country</option>
          {countries.map(country => <option key={country.code} value={country.code}>{country.name}{country.callingCode ? ` (${country.callingCode})` : ''}</option>)}
        </select>
      </label>
      <label>Preferred Currency
        <select name="preferredCurrency" value={preferredCurrency} onChange={e => { setCurrencyTouched(true); setPreferredCurrency(e.target.value) }} required>
          <option value="USD">USD — US Dollar</option>
          {currencies.filter(item => item.code !== 'USD').map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}{item.symbol ? ` (${item.symbol})` : ''}</option>)}
        </select>
      </label>
    </div>
    <div className="form-grid">
      <label>Dashboard Language<LanguageSelect defaultValue="en" /></label>
      <div className="field-help">Your selected country suggests its standard currency automatically. USD remains available as the platform default.</div>
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
      <label>Identification Type
        <select name="idType" required defaultValue="">
          <option value="" disabled>Select Identification Type</option>
          {ID_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>Identification Number<input name="idNumber" autoComplete="off" required minLength={3} maxLength={80} placeholder="Number On The Selected ID" /></label>
    </div>
    <p className="field-help">National ID means the official government-issued identity card for your country. Passport and other accepted government IDs are also supported worldwide. You must be at least 18 years old. Registration is blocked immediately for anyone under 18.</p>

    {initialPlan && <input type="hidden" name="planCode" value={initialPlan} />}
    <div className="alert alert-info">
      <strong>Registration Is Free.</strong> You do not have to pay during account creation. After registration you can activate the annual access plan for your membership type immediately, or skip it and pay later from Billing.
    </div>

    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    <p className="field-help">Use at least 8 characters with upper and lowercase letters and a number. Passwords are never stored in your registration draft.</p>
    </>}
  </>
}
