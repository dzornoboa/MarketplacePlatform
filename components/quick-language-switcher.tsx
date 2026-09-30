'use client'

import { useMemo, useState } from 'react'
import { languageOptions } from '@/components/language-select'

export function QuickLanguageSwitcher({ initialLanguage = 'en' }: { initialLanguage?: string }) {
  const [value, setValue] = useState((initialLanguage || 'en').toLowerCase())
  const [open, setOpen] = useState(false)
  const options = useMemo(() => languageOptions(typeof navigator === 'undefined' ? 'en' : navigator.language), [])

  async function change(next: string) {
    setValue(next)
    localStorage.setItem('wtc-language', next)
    localStorage.setItem('wtc-auto-translate', '1')
    window.dispatchEvent(new Event('wtc-language-change'))
    setOpen(false)
    await fetch('/api/preferences/display', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: next, autoTranslate: true }),
    }).catch(() => {})
  }

  return <div className="quick-language" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button className="quick-language-button" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Change dashboard language">
      {value.slice(0,2).toUpperCase()}
    </button>
    {open && <div className="quick-language-panel" role="dialog" aria-label="Choose language">
      <strong>Language</strong>
      <select value={value} size={12} onChange={e => void change(e.target.value)} aria-label="Dashboard language">
        {options.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
      </select>
      <small>Interface text changes automatically. Names, codes, URLs and currency values remain unchanged.</small>
    </div>}
  </div>
}
