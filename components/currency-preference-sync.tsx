'use client'

import { useEffect, useState } from 'react'

const ORIGINAL = new WeakMap<Text, string>()
const USD_RE = /(?:US\$|USD\s*|\$)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/g
const EXCLUDED = '[data-no-currency],input,textarea,script,style,code,pre'

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

function currencyTextNodes() {
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

function restore(nodes = currencyTextNodes()) {
  nodes.forEach(node => {
    const original = ORIGINAL.get(node)
    if (original !== undefined) node.data = original
  })
}

async function convertVisibleUsd(targetCurrency: string) {
  const nodes = currencyTextNodes()
  restore(nodes)
  if (!targetCurrency || targetCurrency === 'USD') return

  const response = await fetch(`/api/fx?from=USD&to=${encodeURIComponent(targetCurrency)}&amount=1`, { cache: 'no-store' })
  if (!response.ok) return
  const quote = await response.json() as { rate?: number }
  const rate = Number(quote.rate)
  if (!Number.isFinite(rate) || rate <= 0) return

  nodes.forEach(node => {
    const original = ORIGINAL.get(node) ?? node.data
    if (!ORIGINAL.has(node)) ORIGINAL.set(node, original)
    USD_RE.lastIndex = 0
    node.data = original.replace(USD_RE, (match, raw: string) => {
      const usd = Number(String(raw).replaceAll(',', ''))
      return Number.isFinite(usd) ? format(usd * rate, targetCurrency) : match
    })
  })
}

export function CurrencyPreferenceSync({ currency = 'USD' }: { currency?: string | null }) {
  useEffect(() => {
    const next = (currency || 'USD').toUpperCase()
    localStorage.setItem('wtc-currency', next)
    window.dispatchEvent(new CustomEvent('wtc-currency-change', { detail: { currency: next } }))

    let timer: ReturnType<typeof setTimeout> | null = null
    const run = () => { void convertVisibleUsd(next) }
    run()

    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(run, 300)
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
      restore()
    }
  }, [currency])

  return null
}
