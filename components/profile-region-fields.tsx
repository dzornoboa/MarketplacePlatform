'use client'

import { useEffect, useMemo, useState } from 'react'

type CountryOption = { code: string; name: string; callingCode: string }

export function ProfileRegionFields({ country, countryCode, phone, phoneCountryCode }: {
  country: string | null
  countryCode: string | null
  phone: string | null
  phoneCountryCode: string | null
}) {
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [code, setCode] = useState(countryCode ?? '')
  const [localPhone, setLocalPhone] = useState(() => {
    const raw = phone ?? ''
    return phoneCountryCode && raw.startsWith(phoneCountryCode) ? raw.slice(phoneCountryCode.length) : raw.replace(/^\+/, '')
  })

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then((data: { countries?: CountryOption[] }) => {
      const list = data.countries ?? []
      setCountries(list)
      if (!code) {
        const match = list.find(c => c.name.toLowerCase() === (country ?? '').toLowerCase())
        if (match) setCode(match.code)
      }
    }).catch(() => {})
  }, [code, country])

  const selected = useMemo(() => countries.find(c => c.code === code) ?? null, [countries, code])
  const dial = selected?.callingCode || phoneCountryCode || ''
  const normalizedLocal = localPhone.replace(/\D/g, '').replace(/^0+/, '')
  const fullPhone = dial && normalizedLocal ? `${dial}${normalizedLocal}` : localPhone

  return <>
    <div className="form-grid">
      <label>Country
        <select name="countryCode" value={code} onChange={e => setCode(e.target.value)} required>
          <option value="" disabled>Select Country</option>
          {countries.map(item => <option key={item.code} value={item.code}>{item.name}{item.callingCode ? ` (${item.callingCode})` : ''}</option>)}
        </select>
      </label>
      <label>Telephone Number
        <div className="phone-field">
          <span className="phone-prefix">{dial || '+'}</span>
          <input type="tel" inputMode="tel" value={localPhone} onChange={e => setLocalPhone(e.target.value.replace(/[^0-9 ()-]/g, ''))} required />
        </div>
      </label>
    </div>
    <input type="hidden" name="country" value={selected?.name ?? country ?? ''} />
    <input type="hidden" name="phoneCountryCode" value={dial} />
    <input type="hidden" name="phone" value={fullPhone} />
  </>
}
