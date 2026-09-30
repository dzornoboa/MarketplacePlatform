'use client'

import { useEffect, useState } from 'react'

type Currency = { code: string; name: string; symbol: string }

export function CurrencySelect({ name = 'preferredCurrency', defaultValue = 'USD' }: { name?: string; defaultValue?: string | null }) {
  const [items, setItems] = useState<Currency[]>([])
  const [value, setValue] = useState((defaultValue || 'USD').toUpperCase())
  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then((data: { currencies?: Currency[] }) => setItems(data.currencies ?? [])).catch(() => {})
  }, [])
  return <select name={name} value={value} onChange={e => setValue(e.target.value)} required>
    <option value="USD">USD — US Dollar</option>
    {items.filter(item => item.code !== 'USD').map(item => <option key={item.code} value={item.code}>{item.code} — {item.name}{item.symbol ? ` (${item.symbol})` : ''}</option>)}
  </select>
}
