'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'wtc-language'
const TEXT_ORIGINAL = new WeakMap<Text, string>()
const PLACEHOLDER_ORIGINAL = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>()
const EXCLUDED = '[data-no-translate],.no-translate,.logo,.verify-code,script,style,code,pre,[contenteditable="true"]'

function validText(value: string) {
  const text = value.trim()
  if (text.length < 2 || text.length > 600) return false
  if (/^(https?:|www\.|\S+@\S+|[+\d\s.,%$€£¥₵:/-]+)$/i.test(text)) return false
  return true
}

function collectTextNodes() {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  while (current) {
    const node = current as Text
    const parent = node.parentElement
    if (parent && !parent.closest(EXCLUDED) && validText(node.data)) nodes.push(node)
    current = walker.nextNode()
  }
  return nodes
}

function collectPlaceholders() {
  return [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder],textarea[placeholder]')]
    .filter(el => !el.closest(EXCLUDED) && validText(el.placeholder))
}

async function translateBatch(texts: string[], targetLanguage: string) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLanguage }),
  })
  if (!response.ok) return null
  const data = await response.json() as { translations?: string[] }
  return Array.isArray(data.translations) && data.translations.length === texts.length ? data.translations : null
}

async function translatePage(language: string) {
  const target = (language || 'en').toLowerCase()
  const textNodes = collectTextNodes()
  const placeholders = collectPlaceholders()

  if (target.startsWith('en')) {
    document.documentElement.lang = 'en'
    textNodes.forEach(node => {
      const original = TEXT_ORIGINAL.get(node)
      if (original !== undefined) node.data = original
    })
    placeholders.forEach(el => {
      const original = PLACEHOLDER_ORIGINAL.get(el)
      if (original !== undefined) el.placeholder = original
    })
    return
  }

  document.documentElement.lang = target

  const entries: { original: string; apply: (translated: string) => void }[] = []
  for (const node of textNodes) {
    const original = TEXT_ORIGINAL.get(node) ?? node.data
    if (!TEXT_ORIGINAL.has(node)) TEXT_ORIGINAL.set(node, original)
    entries.push({ original: original.trim(), apply: translated => { node.data = node.data.replace(original.trim(), translated) } })
  }
  for (const el of placeholders) {
    const original = PLACEHOLDER_ORIGINAL.get(el) ?? el.placeholder
    if (!PLACEHOLDER_ORIGINAL.has(el)) PLACEHOLDER_ORIGINAL.set(el, original)
    entries.push({ original, apply: translated => { el.placeholder = translated } })
  }

  const unique = [...new Set(entries.map(entry => entry.original).filter(Boolean))]
  const translated = new Map<string,string>()
  for (let i = 0; i < unique.length; i += 60) {
    const batch = unique.slice(i, i + 60)
    const values = await translateBatch(batch, target)
    if (!values) return
    batch.forEach((text, index) => translated.set(text, values[index] ?? text))
  }

  entries.forEach(entry => {
    const value = translated.get(entry.original)
    if (value) entry.apply(value)
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
      timer = setTimeout(() => void run(), 300)
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
