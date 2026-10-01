'use client'

import { useEffect } from 'react'

/* Publishes the signed-in member's saved currency to this browser. The
   conversion itself is done by CurrencyConversion, which is mounted in the root
   layout so public pages follow the same preference. */
export function CurrencyPreferenceSync({ currency = 'USD' }: { currency?: string | null }) {
  useEffect(() => {
    const next = (currency || 'USD').toUpperCase()
    if (localStorage.getItem('wtc-currency') !== next) localStorage.setItem('wtc-currency', next)
    window.dispatchEvent(new CustomEvent('wtc-currency-change', { detail: { currency: next } }))
  }, [currency])

  return null
}
