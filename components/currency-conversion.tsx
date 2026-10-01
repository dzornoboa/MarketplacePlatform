'use client'

import { useEffect } from 'react'

/* Prices are written to the page in US dollars. This converts every dollar
   amount on screen into the currency the reader has chosen, on every page of
   the platform rather than only inside the dashboard, and puts the original
   back when they choose dollars again.

   The rate is fetched once per currency and kept for the session, so moving
   between pages does not ask for it again. */

const ORIGINAL = new WeakMap<Text, string>()
const USD_RE = /(?:US\$|USD\s?|\$)\s?([0-9][0-9,]*(?:\.[0-9]+)?)/g
const EXCLUDED = '[data-no-currency],input,textarea,script,style,code,pre'
const RATE_TTL = 3_600_000

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

async function rateFor(currency: string): Promise<number | null> {
  const key = 'wtc-fx-' + currency
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const saved = JSON.parse(raw) as { rate?: number; at?: number }
      if (Number(saved.rate) > 0 && Date.now() - Number(saved.at) < RATE_TTL) return Number(saved.rate)
    }
  } catch {}

  const response = await fetch(`/api/fx?from=USD&to=${encodeURIComponent(currency)}&amount=1`).catch(() => null)
  if (!response?.ok) return null
  const quote = await response.json().catch(() => null) as { rate?: number } | null
  const rate = Number(quote?.rate)
  if (!Number.isFinite(rate) || rate <= 0) return null
  try { sessionStorage.setItem(key, JSON.stringify({ rate, at: Date.now() })) } catch {}
  return rate
}

function amountNodes() {
  const out: Text[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  while (current) {
    const node = current as Text
    const parent = node.parentElement
    USD_RE.lastIndex = 0
    if (parent && !parent.closest(EXCLUDED) && USD_RE.test(ORIGINAL.get(node) ?? node.data)) out.push(node)
    current = walker.nextNode()
  }
  return out
}

function restore(nodes = amountNodes()) {
  nodes.forEach(node => {
    const original = ORIGINAL.get(node)
    if (original !== undefined && node.data !== original) node.data = original
  })
}

async function convert(target: string) {
  const nodes = amountNodes()
  if (!target || target === 'USD') { restore(nodes); return }

  const rate = await rateFor(target)
  if (!rate) return

  nodes.forEach(node => {
    const original = ORIGINAL.get(node) ?? node.data
    if (!ORIGINAL.has(node)) ORIGINAL.set(node, original)
    USD_RE.lastIndex = 0
    const converted = original.replace(USD_RE, (match, raw: string) => {
      const usd = Number(String(raw).replaceAll(',', ''))
      return Number.isFinite(usd) ? format(usd * rate, target) : match
    })
    if (node.data !== converted) node.data = converted
  })
}

export function CurrencyConversion() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let current = (localStorage.getItem('wtc-currency') || 'USD').toUpperCase()

    const run = () => { void convert(current) }
    run()

    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(run, 250)
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const onCurrency = (event: Event) => {
      const next = (event as CustomEvent<{ currency?: string }>).detail?.currency
        ?? localStorage.getItem('wtc-currency') ?? 'USD'
      current = next.toUpperCase()
      restore()
      run()
    }
    window.addEventListener('wtc-currency-change', onCurrency)

    // Another tab changing the preference should change this one too.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'wtc-currency' || !event.newValue) return
      current = event.newValue.toUpperCase()
      restore()
      run()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
      window.removeEventListener('wtc-currency-change', onCurrency)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return null
}
