'use client'

import { useEffect } from 'react'

const ORIGINAL = 'data-wtc-original-currency'
const SELECTOR = 'h1,h2,h3,h4,p,span,strong,small,label,button,a,summary,dt,dd,th,td,li,.button,.field-help,.muted,.eyebrow'
const USD_RE = /(?:US\$|USD\s*)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/g

function shouldConvert(el: HTMLElement) {
  if (el.closest('[data-no-currency],input,textarea,script,style,code,pre')) return false
  if (el.children.length > 0) return false
  const text = el.textContent ?? ''
  return USD_RE.test(text)
}

function format(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount >= 1_000_000 ? 1 : 2,
      notation: amount >= 1_000_000 ? 'compact' : 'standard',
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

async function convertVisibleUsd(targetCurrency: string) {
  if (!targetCurrency || targetCurrency === 'USD') return
  const response = await fetch(`/api/fx?from=USD&to=${encodeURIComponent(targetCurrency)}&amount=1`, { cache: 'no-store' })
  if (!response.ok) return
  const quote = await response.json() as { rate?: number }
  const rate = Number(quote.rate)
  if (!Number.isFinite(rate) || rate <= 0) return

  document.querySelectorAll<HTMLElement>(SELECTOR).forEach(el => {
    USD_RE.lastIndex = 0
    if (!shouldConvert(el)) return
    const current = el.textContent ?? ''
    if (!el.hasAttribute(ORIGINAL)) el.setAttribute(ORIGINAL, current)
    USD_RE.lastIndex = 0
    el.textContent = current.replace(USD_RE, (_match, raw: string) => {
      const usd = Number(String(raw).replaceAll(',', ''))
      return Number.isFinite(usd) ? format(usd * rate, targetCurrency) : _match
    })
    el.setAttribute('data-wtc-display-currency', targetCurrency)
  })
}

export function CurrencyPreferenceSync({ currency = 'USD' }: { currency?: string | null }) {
  useEffect(() => {
    const next = (currency || 'USD').toUpperCase()
    localStorage.setItem('wtc-currency', next)
    let timer: ReturnType<typeof setTimeout> | null = null
    const run = () => {
      if (next === 'USD') return
      void convertVisibleUsd(next)
    }
    run()
    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(run, 300)
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [currency])
  return null
}
