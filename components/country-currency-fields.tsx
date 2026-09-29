'use client'

import { useEffect, useMemo, useState } from 'react'

export type CountryOption = {
  code: string
  name: string
  callingCode: string
  currencyCode: string
  currencyName: string
  currencySymbol: string
  flag?: string
  region?: string
  subregion?: string
}

export type CurrencyOption = {
  code: string
  name: string
  symbol: string
}

export function CountryCurrencyFields({
  initialCountry = '',
  initialCountryCode = '',
  initialCurrency = 'USD',
  countryName = 'country',
  countryCodeName = 'countryCode',
  currencyName = 'currency',
  countryLabel = 'Country',
  currencyLabel = 'Currency',
  includeCurrency = true,
  autoMatchCurrency = true,
}: {
  initialCountry?: string | null
  initialCountryCode?: string | null
  initialCurrency?: string | null
  countryName?: string
  countryCodeName?: string
  currencyName?: string
  countryLabel?: string
  currencyLabel?: string
  includeCurrency?: boolean
  autoMatchCurrency?: boolean
}) {
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
  const [code, setCode] = useState(initialCountryCode ?? '')
  const [currency, setCurrency] = useState((initialCurrency || 'USD').toUpperCase())
  const [currencyTouched, setCurrencyTouched] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/regions').then(r => r.json()).then((data: { countries?: CountryOption[]; currencies?: CurrencyOption[] }) => {
      if (cancelled) return
      const list = data.countries ?? []
      setCountries(list)
      setCurrencies(data.currencies ?? [])
      if (!code) {
        const byName = list.find(c => c.name.toLowerCase() === (initialCountry ?? '').toLowerCase())
        const localeRegion = (navigator.language.match(/-([A-Z]{2})$/i)?.[1] ?? '').toUpperCase()
        const initial = byName ?? list.find(c => c.code === localeRegion) ?? list.find(c => c.code === 'GH') ?? list[0]
        if (initial) setCode(initial.code)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const selected = useMemo(() => countries.find(c => c.code === code) ?? null, [countries, code])

  useEffect(() => {
    if (!selected || !includeCurrency || !autoMatchCurrency || currencyTouched) return
    setCurrency(selected.currencyCode || 'USD')
  }, [selected?.code])

  return <>
    <label>{countryLabel}
      <select name={countryCodeName} value={code} onChange={event => setCode(event.target.value)} required>
        <option value="" disabled>Select Country</option>
        {countries.map(country => <option key={country.code} value={country.code}>{country.flag ? country.flag + ' ' : ''}{country.name}{country.callingCode ? ` (${country.callingCode})` : ''}</option>)}
      </select>
    </label>
    <input type="hidden" name={countryName} value={selected?.name ?? initialCountry ?? ''} />
    {includeCurrency && <label>{currencyLabel}
      <select name={currencyName} value={currency} onChange={event => { setCurrencyTouched(true); setCurrency(event.target.value) }} required>
        <option value="USD">USD — US Dollar</option>
        {currencies.filter(item => item.code !== 'USD').map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}{item.symbol ? ` (${item.symbol})` : ''}</option>)}
      </select>
    </label>}
  </>
}

export function FxQuote({
  amount,
  from,
  to = 'USD',
}: {
  amount: number | string
  from: string
  to?: string
}) {
  const [quote, setQuote] = useState<{ converted: number; rate: number; asOf?: string | null } | null>(null)
  const numeric = Number(amount)

  useEffect(() => {
    if (!Number.isFinite(numeric) || numeric <= 0 || !/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
      setQuote(null)
      return
    }
    if (from === to) {
      setQuote({ converted: numeric, rate: 1 })
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch(`/api/fx?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${numeric}`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : null)
        .then(data => setQuote(data?.converted ? data : null))
        .catch(() => {})
    }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [numeric, from, to])

  if (!quote) return null
  return <small className="field-help fx-quote">≈ {new Intl.NumberFormat(undefined, { style: 'currency', currency: to, maximumFractionDigits: 2 }).format(quote.converted)} · 1 {from} = {quote.rate.toFixed(4)} {to}</small>
}

export function MoneyCurrencyField({
  amountName,
  amountLabel,
  initialAmount = '',
  initialCurrency = 'USD',
  currencyName = 'currency',
}: {
  amountName: string
  amountLabel: string
  initialAmount?: number | string | null
  initialCurrency?: string | null
  currencyName?: string
}) {
  const [amount, setAmount] = useState(String(initialAmount ?? ''))
  const [currency, setCurrency] = useState((initialCurrency || 'USD').toUpperCase())
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then((data: { currencies?: CurrencyOption[] }) => setCurrencies(data.currencies ?? [])).catch(() => {})
  }, [])

  return <>
    <label>{amountLabel}
      <input name={amountName} type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} />
    </label>
    <label>Currency
      <select name={currencyName} value={currency} onChange={event => setCurrency(event.target.value)} required>
        <option value="USD">USD — US Dollar</option>
        {currencies.filter(item => item.code !== 'USD').map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}</option>)}
      </select>
      <FxQuote amount={amount} from={currency} to="USD" />
    </label>
  </>
}
