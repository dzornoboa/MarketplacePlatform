'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'wtc-language'
const TEXT_ORIGINAL = new WeakMap<Text, string>()
const PLACEHOLDER_ORIGINAL = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>()
const EXCLUDED = '[data-no-translate],.no-translate,.logo,.verify-code,script,style,code,pre,[contenteditable="true"]'

/* Phrases already translated in this tab. The interface repeats the same wording
   on every page, so this is what makes the second page instant instead of
   another round trip. It is kept in sessionStorage so moving between pages does
   not start from nothing, and it holds only interface text. */
const memory = new Map<string, Map<string, string>>()

function store(language: string) {
  let table = memory.get(language)
  if (table) return table
  table = new Map<string, string>()
  try {
    const raw = sessionStorage.getItem('wtc-translations-' + language)
    if (raw) for (const [key, value] of Object.entries(JSON.parse(raw) as Record<string, string>)) table.set(key, value)
  } catch {}
  memory.set(language, table)
  return table
}

function persist(language: string) {
  const table = memory.get(language)
  if (!table) return
  try {
    const trimmed = [...table.entries()].slice(-4000)
    sessionStorage.setItem('wtc-translations-' + language, JSON.stringify(Object.fromEntries(trimmed)))
  } catch {}
}

function announce(state: 'working' | 'done' | 'error', detail?: string) {
  window.dispatchEvent(new CustomEvent('wtc-translate-state', { detail: { state, message: detail ?? null } }))
}

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
    if (parent && !parent.closest(EXCLUDED) && validText(TEXT_ORIGINAL.get(node) ?? node.data)) nodes.push(node)
    current = walker.nextNode()
  }
  return nodes
}

function collectPlaceholders() {
  return [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder],textarea[placeholder]')]
    .filter(el => !el.closest(EXCLUDED) && validText(PLACEHOLDER_ORIGINAL.get(el) ?? el.placeholder))
}

async function translateBatch(texts: string[], targetLanguage: string) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLanguage }),
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(problem?.error || 'The translation service did not answer.')
  }
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
  const table = store(target)

  const entries: { original: string; apply: (translated: string) => void }[] = []
  for (const node of textNodes) {
    const original = TEXT_ORIGINAL.get(node) ?? node.data
    if (!TEXT_ORIGINAL.has(node)) TEXT_ORIGINAL.set(node, original)
    entries.push({ original: original.trim(), apply: translated => { node.data = (TEXT_ORIGINAL.get(node) ?? original).replace(original.trim(), translated) } })
  }
  for (const el of placeholders) {
    const original = PLACEHOLDER_ORIGINAL.get(el) ?? el.placeholder
    if (!PLACEHOLDER_ORIGINAL.has(el)) PLACEHOLDER_ORIGINAL.set(el, original)
    entries.push({ original, apply: translated => { el.placeholder = translated } })
  }

  // Anything already known is applied at once, before any network call.
  const apply = () => entries.forEach(entry => {
    const value = table.get(entry.original)
    if (value) entry.apply(value)
  })
  apply()

  const unique = [...new Set(entries.map(entry => entry.original).filter(text => text && !table.has(text)))]
  if (unique.length === 0) {
    announce('done')
    return
  }

  announce('working')
  let failure: string | null = null
  for (let i = 0; i < unique.length; i += 60) {
    const batch = unique.slice(i, i + 60)
    try {
      const values = await translateBatch(batch, target)
      if (!values) { failure = 'The translation service returned an unexpected answer.'; break }
      batch.forEach((text, index) => table.set(text, values[index] ?? text))
      apply()
    } catch (error) {
      failure = error instanceof Error ? error.message : 'Translation failed.'
      break
    }
  }
  persist(target)
  announce(failure ? 'error' : 'done', failure ?? undefined)
}

export function AutoTranslate() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let translating = false
    let queued = false

    /* A language chosen while a translation is still in flight has to be
       honoured, so the request is remembered and run as soon as the current
       pass finishes. Dropping it was one reason the page stayed in English. */
    const run = async () => {
      if (translating) { queued = true; return }
      translating = true
      try {
        do {
          queued = false
          const enabled = localStorage.getItem('wtc-auto-translate') === '1'
          const language = enabled ? (localStorage.getItem(STORAGE_KEY) || 'en') : 'en'
          await translatePage(language)
        } while (queued)
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
