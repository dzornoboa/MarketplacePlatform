'use client'

import { useEffect, useMemo, useState } from 'react'
import { languageOptions } from '@/components/language-select'

/* The language button in the floating dock. Hovering opens the list; choosing a
   language translates the page immediately and remembers the choice for the
   signed-in member. */
export function QuickLanguageSwitcher({ initialLanguage = 'en' }: { initialLanguage?: string }) {
  const [value, setValue] = useState((initialLanguage || 'en').toLowerCase())
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const [problem, setProblem] = useState<string | null>(null)
  const options = useMemo(() => languageOptions(typeof navigator === 'undefined' ? 'en' : navigator.language), [])

  useEffect(() => {
    const stored = localStorage.getItem('wtc-language')
    setValue((stored || initialLanguage || 'en').toLowerCase())
  }, [initialLanguage])

  // The translator reports back, so a failure is visible instead of the page
  // simply staying in English with no explanation.
  useEffect(() => {
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<{ state?: string; message?: string | null }>).detail
      if (detail?.state === 'working') { setStatus('working'); setProblem(null) }
      else if (detail?.state === 'error') { setStatus('error'); setProblem(detail.message ?? 'Translation is unavailable right now.') }
      else { setStatus('idle'); setProblem(null) }
    }
    window.addEventListener('wtc-translate-state', onState)
    return () => window.removeEventListener('wtc-translate-state', onState)
  }, [])

  async function change(next: string) {
    setValue(next)
    localStorage.setItem('wtc-language', next)
    localStorage.setItem('wtc-auto-translate', next.startsWith('en') ? '0' : '1')
    window.dispatchEvent(new Event('wtc-language-change'))
    setOpen(false)
    await fetch('/api/preferences/display', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: next, autoTranslate: !next.startsWith('en') }),
    }).catch(() => {})
  }

  return <div className="quick-language" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    {open && <div className="quick-language-panel" role="dialog" aria-label="Choose language">
      <strong>Language</strong>
      <select value={value} size={12} onChange={e => void change(e.target.value)} aria-label="Page language">
        {options.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
      </select>
      {status === 'error'
        ? <small className="quick-language-problem">{problem}</small>
        : <small>{status === 'working' ? 'Translating this page…' : 'Interface text changes automatically. Names, codes, URLs and currency values remain unchanged.'}</small>}
    </div>}
    <button className="quick-language-button" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Change the page language" data-status={status}>
      {status === 'working' ? '…' : value.slice(0, 2).toUpperCase()}
    </button>
  </div>
}
