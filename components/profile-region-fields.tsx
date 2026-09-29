'use client'

import { useEffect, useMemo, useState } from 'react'

type CountryOption = { code: string; name: string; callingCode: string; currencyCode: string; currencyName: string; currencySymbol: string }
type CurrencyOption = { code: string; name: string; symbol: string }

export function ProfileRegionFields({ country, countryCode, phone, phoneCountryCode, preferredCurrency }: {
  country: string | null
  countryCode: string | null
  phone: string | null
  phoneCountryCode: string | null
  preferredCurrency?: string | null
}) {
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
  const [code, setCode] = useState(countryCode ?? '')
  const [currency, setCurrency] = useState((preferredCurrency || 'USD').toUpperCase())
  const [currencyTouched, setCurrencyTouched] = useState(false)
  const [countryTouched, setCountryTouched] = useState(false)
  const cleanLocalNumber = (raw: string, dial: string) => {
    let digits = raw.replace(/\D/g, '')
    const dialDigits = dial.replace(/\D/g, '')
    if (dialDigits && digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length)
    return digits.replace(/^0+/, '')
  }

  const [localPhone, setLocalPhone] = useState(() => cleanLocalNumber(phone ?? '', phoneCountryCode ?? ''))

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then((data: { countries?: CountryOption[]; currencies?: CurrencyOption[] }) => {
      const list = data.countries ?? []
      setCountries(list)
      setCurrencies(data.currencies ?? [])
      if (!code) {
        const match = list.find(c => c.name.toLowerCase() === (country ?? '').toLowerCase())
        if (match) {
          setCode(match.code)
          setLocalPhone(cleanLocalNumber(phone ?? '', match.callingCode))
        }
      } else {
        const match = list.find(c => c.code === code)
        if (match) setLocalPhone(cleanLocalNumber(phone ?? '', match.callingCode))
      }
    }).catch(() => {})
  }, [])

  const selected = useMemo(() => countries.find(c => c.code === code) ?? null, [countries, code])

  useEffect(() => {
    if (!selected || currencyTouched || !countryTouched) return
    setCurrency(selected.currencyCode || 'USD')
  }, [selected?.code, countryTouched, currencyTouched])
  const dial = selected?.callingCode || phoneCountryCode || ''
  const normalizedLocal = cleanLocalNumber(localPhone, dial)
  const fullPhone = dial && normalizedLocal ? `${dial}${normalizedLocal}` : normalizedLocal

  return <>
    <div className="form-grid">
      <label>Country
        <select name="countryCode" value={code} onChange={e => { setCountryTouched(true); setCurrencyTouched(false); setCode(e.target.value) }} required>
          <option value="" disabled>Select Country</option>
          {countries.map(item => <option key={item.code} value={item.code}>{item.name}{item.callingCode ? ` (${item.callingCode})` : ''}</option>)}
        </select>
      </label>
      <label>Preferred Currency
        <select name="preferredCurrency" value={currency} onChange={e => { setCurrencyTouched(true); setCurrency(e.target.value) }} required>
          <option value="USD">USD — US Dollar</option>
          {currencies.filter(item => item.code !== 'USD').map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}{item.symbol ? ` (${item.symbol})` : ''}</option>)}
        </select>
      </label>
    </div>
    <div className="form-grid">
      <label>Telephone Number
        <div className="phone-field">
          <span className="phone-prefix">{dial || '+'}</span>
          <input type="tel" inputMode="tel" value={localPhone} onChange={e => setLocalPhone(e.target.value.replace(/[^0-9 ()-]/g, ''))} placeholder="20 123 4567" required />
        </div>
      </label>
    </div>
    <input type="hidden" name="country" value={selected?.name ?? country ?? ''} />
    <input type="hidden" name="phoneCountryCode" value={dial} />
    <input type="hidden" name="phone" value={fullPhone} />
  </>
}
