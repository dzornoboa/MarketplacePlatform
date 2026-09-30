'use client'

import { useEffect, useState } from 'react'

type Currency = { code: string; name: string; symbol: string }

export function CurrencySelect({ name = 'preferredCurrency', defaultValue = 'USD', persist = false }: { name?: string; defaultValue?: string | null; persist?: boolean }) {
  const [items, setItems] = useState<Currency[]>([])
  const [value, setValue] = useState((defaultValue || 'USD').toUpperCase())
  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then((data: { currencies?: Currency[] }) => setItems(data.currencies ?? [])).catch(() => {})
  }, [])
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
    <option value="USD">USD — US Dollar</option>
    {items.filter(item => item.code !== 'USD').map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}{item.symbol ? ` (${item.symbol})` : ''}</option>)}
  </select>
}
