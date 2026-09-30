'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'wtc-language'
const ORIGINAL = 'data-wtc-original-text'
const TRANSLATED = 'data-wtc-translated-language'
const selector = 'h1,h2,h3,h4,p,label,button,a,summary,dt,dd,th,td,option,.button,.field-help,.muted,.eyebrow'

function shouldTranslate(el: Element) {
  if (el.closest('[data-no-translate],.no-translate,.logo,.verify-code,script,style,code,pre')) return false
  const text = el.textContent?.trim() ?? ''
  if (text.length < 2 || text.length > 600) return false
  if (/^(https?:|www\.|\S+@\S+|[+\d\s.,%$€£¥₵:/-]+)$/i.test(text)) return false
  if (el.children.length > 0 && !['OPTION','BUTTON'].includes(el.tagName)) return false
  return true
}

async function translatePage(language: string) {
  const target = (language || 'en').toLowerCase()
  if (target.startsWith('en')) {
    document.documentElement.lang = 'en'
    document.querySelectorAll<HTMLElement>(`[${ORIGINAL}]`).forEach(el => {
      const original = el.getAttribute(ORIGINAL)
      if (original !== null) el.textContent = original
      el.removeAttribute(ORIGINAL)
      el.removeAttribute(TRANSLATED)
    })
    return
  }

  document.documentElement.lang = target
  const elements = [...document.querySelectorAll<HTMLElement>(selector)].filter(shouldTranslate)
  const pending = elements.filter(el => el.getAttribute(TRANSLATED) !== target)
  if (!pending.length) return

  const originals = pending.map(el => {
    const stored = el.getAttribute(ORIGINAL)
    const original = stored ?? (el.textContent?.trim() ?? '')
    if (stored === null) el.setAttribute(ORIGINAL, original)
    else if (el.getAttribute(TRANSLATED) && el.getAttribute(TRANSLATED) !== target) el.textContent = original
    return original
  })
  const unique = [...new Set(originals.filter(Boolean))]
  const map = new Map<string,string>()

  for (let i = 0; i < unique.length; i += 60) {
    const batch = unique.slice(i, i + 60)
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: batch, targetLanguage: target }),
    })
    if (!response.ok) return
    const data = await response.json() as { translations?: string[] }
    if (!Array.isArray(data.translations) || data.translations.length !== batch.length) return
    batch.forEach((text, index) => map.set(text, data.translations?.[index] ?? text))
  }

  pending.forEach((el, index) => {
    const original = originals[index]
    const translated = map.get(original)
    if (!translated) return
    el.textContent = translated
    el.setAttribute(TRANSLATED, target)
  })
}

export function AutoTranslate() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let translating = false

    const run = async () => {
      if (translating) return
      translating = true
      try {
        const enabled = localStorage.getItem('wtc-auto-translate') === '1'
        const language = enabled ? (localStorage.getItem(STORAGE_KEY) || 'en') : 'en'
        await translatePage(language)
      } finally {
        translating = false
      }
    }

    void run()
    const observer = new MutationObserver(() => {
      if (translating) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void run(), 250)
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const onLanguage = () => {
      if (timer) clearTimeout(timer)
      void run()
    }
    window.addEventListener('wtc-language-change', onLanguage)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
      window.removeEventListener('wtc-language-change', onLanguage)
    }
  }, [])
  return null
}
