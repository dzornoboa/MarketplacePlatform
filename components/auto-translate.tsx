'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'wtc-language'
const ORIGINAL = 'data-wtc-original-text'
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
  if (!language || language.toLowerCase().startsWith('en')) {
    document.documentElement.lang = 'en'
    document.querySelectorAll<HTMLElement>(`[${ORIGINAL}]`).forEach(el => {
      const original = el.getAttribute(ORIGINAL)
      if (original !== null) el.textContent = original
      el.removeAttribute(ORIGINAL)
    })
    return
  }

  document.documentElement.lang = language
  const elements = [...document.querySelectorAll<HTMLElement>(selector)].filter(shouldTranslate)
  const pending = elements.filter(el => !el.hasAttribute(ORIGINAL))
  if (!pending.length) return
  const texts = pending.map(el => el.textContent?.trim() ?? '')
  const unique = [...new Set(texts)]
  const map = new Map<string,string>()

  for (let i = 0; i < unique.length; i += 60) {
    const batch = unique.slice(i, i + 60)
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: batch, targetLanguage: language }),
    })
    if (!response.ok) return
    const data = await response.json() as { translations?: string[] }
    if (!Array.isArray(data.translations)) return
    batch.forEach((text, index) => map.set(text, data.translations?.[index] ?? text))
  }

  pending.forEach((el, index) => {
    const original = texts[index]
    const translated = map.get(original)
    if (!translated || translated === original) return
    el.setAttribute(ORIGINAL, original)
    el.textContent = translated
  })
}

export function AutoTranslate() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const run = () => {
      const enabled = localStorage.getItem('wtc-auto-translate') === '1'
      const language = enabled ? (localStorage.getItem(STORAGE_KEY) || 'en') : 'en'
      void translatePage(language)
    }
    run()
    const observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(run, 250)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const onLanguage = () => run()
    window.addEventListener('wtc-language-change', onLanguage)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
      window.removeEventListener('wtc-language-change', onLanguage)
    }
  }, [])
  return null
}
