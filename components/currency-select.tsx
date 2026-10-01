'use client'

import { useEffect, useMemo, useState } from 'react'

type Currency = { code: string; name: string; symbol: string }

/* Every currency the browser knows about — the full ISO 4217 list, read from
   Intl rather than kept as a table in this repository, so it stays correct as
   currencies are added or withdrawn. Names are shown in the reader's own
   language. */
export function worldCurrencies(uiLocale = 'en'): Currency[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf
  const codes = typeof supported === 'function' ? supported('currency') : []
  if (codes.length === 0) return []

  let names: Intl.DisplayNames | null = null
  try { names = new Intl.DisplayNames([uiLocale], { type: 'currency' }) } catch { names = null }

  return codes.map(code => {
    let symbol = code
    try {
      const parts = new Intl.NumberFormat(uiLocale, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0)
      symbol = parts.find(part => part.type === 'currency')?.value ?? code
    } catch {}
    return { code, name: names?.of(code) ?? code, symbol }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

export function CurrencySelect({ name = 'preferredCurrency', defaultValue = 'USD', persist = false }: { name?: string; defaultValue?: string | null; persist?: boolean }) {
  const [fallback, setFallback] = useState<Currency[]>([])
  const [value, setValue] = useState((defaultValue || 'USD').toUpperCase())
  /* The first render has to match the server's, which has no navigator, so the
     reader's own locale is picked up after mounting. */
  const [locale, setLocale] = useState('en')
  useEffect(() => { setLocale(navigator.language || 'en') }, [])
  const fromIntl = useMemo(() => worldCurrencies(locale), [locale])
  const items = fromIntl.length > 0 ? fromIntl : fallback

  // Only needed on a browser too old for Intl.supportedValuesOf.
  useEffect(() => {
    if (fromIntl.length > 0) return
    fetch('/api/regions')
      .then(r => r.json())
      .then((data: { currencies?: Currency[] }) => setFallback(data.currencies ?? []))
      .catch(() => {})
  }, [fromIntl.length])

  const change = (next: string) => {
    setValue(next)
    localStorage.setItem('wtc-currency', next)
    window.dispatchEvent(new CustomEvent('wtc-currency-change', { detail: { currency: next } }))
    if (persist) {
      void fetch('/api/preferences/display', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currency: next }),
      }).catch(() => {})
    }
  }

  return <select name={name} value={value} onChange={e => change(e.target.value)} required>
    {items.length === 0 && <option value={value}>{value}</option>}
    {items.map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}{item.symbol && item.symbol !== item.code ? ` (${item.symbol})` : ''}</option>)}
  </select>
}
