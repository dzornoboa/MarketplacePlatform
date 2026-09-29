'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CountryOption, CurrencyOption } from '@/components/country-currency-fields'
import { FxQuote } from '@/components/country-currency-fields'

export function ListingFinancialFields({
  initialCountry = '',
  initialCountryCode = '',
  initialCity = '',
  initialCurrency = 'USD',
  initialCapitalRequired = '',
  initialMinimumTicket = '',
}: {
  initialCountry?: string | null
  initialCountryCode?: string | null
  initialCity?: string | null
  initialCurrency?: string | null
  initialCapitalRequired?: number | string | null
  initialMinimumTicket?: number | string | null
}) {
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
  const [countryCode, setCountryCode] = useState(initialCountryCode ?? '')
  const [currency, setCurrency] = useState((initialCurrency || 'USD').toUpperCase())
  const [currencyTouched, setCurrencyTouched] = useState(false)
  const [capital, setCapital] = useState(String(initialCapitalRequired ?? ''))
  const [ticket, setTicket] = useState(String(initialMinimumTicket ?? ''))

  useEffect(() => {
    let cancelled = false
    fetch('/api/regions').then(r => r.json()).then((data: { countries?: CountryOption[]; currencies?: CurrencyOption[] }) => {
      if (cancelled) return
      const list = data.countries ?? []
      setCountries(list)
      setCurrencies(data.currencies ?? [])
      if (!countryCode) {
        const match = list.find(item => item.name.toLowerCase() === (initialCountry ?? '').toLowerCase())
        const initial = match ?? list.find(item => item.code === 'GH') ?? list[0]
        if (initial) setCountryCode(initial.code)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const country = useMemo(() => countries.find(item => item.code === countryCode) ?? null, [countries, countryCode])

  useEffect(() => {
    if (!country || currencyTouched) return
    setCurrency(country.currencyCode || 'USD')
  }, [country?.code])

  return <>
    <div className="form-grid">
      <label>Country
        <select name="countryCode" value={countryCode} onChange={event => setCountryCode(event.target.value)} required>
          <option value="" disabled>Select Country</option>
          {countries.map(item => <option key={item.code} value={item.code}>{item.flag ? item.flag + ' ' : ''}{item.name}</option>)}
        </select>
      </label>
      <label>City<input name="city" defaultValue={initialCity ?? ''} /></label>
    </div>
    <input type="hidden" name="country" value={country?.name ?? initialCountry ?? ''} />

    <div className="form-grid">
      <label>Capital Required
        <input name="capitalRequired" type="number" min="0" step="0.01" value={capital} onChange={event => setCapital(event.target.value)} placeholder="2500000" />
        <FxQuote amount={capital} from={currency} to="USD" />
      </label>
      <label>Minimum Ticket
        <input name="minimumTicket" type="number" min="0" step="0.01" value={ticket} onChange={event => setTicket(event.target.value)} placeholder="250000" />
        <FxQuote amount={ticket} from={currency} to="USD" />
      </label>
    </div>

    <label>Currency
      <select name="currency" value={currency} onChange={event => { setCurrencyTouched(true); setCurrency(event.target.value) }} required>
        <option value="USD">USD — US Dollar</option>
        {currencies.filter(item => item.code !== 'USD').map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}{item.symbol ? ` (${item.symbol})` : ''}</option>)}
      </select>
    </label>
    <p className="field-help">Country selection suggests its local currency automatically. You can keep or switch to USD. Live USD equivalents are shown for comparison and the submitted currency remains the transaction currency.</p>
  </>
}
