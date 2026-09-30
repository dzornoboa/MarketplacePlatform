'use client'

import { useEffect, useMemo, useState } from 'react'

export function languageOptions(uiLocale = 'en') {
  const display = new Intl.DisplayNames([uiLocale], { type: 'language' })
  const out: { code: string; name: string }[] = []
  const seen = new Set<string>()
  for (let a = 97; a <= 122; a++) for (let b = 97; b <= 122; b++) {
    const code = String.fromCharCode(a, b)
    const name = display.of(code)
    if (name && name.toLowerCase() !== code) { out.push({ code, name }); seen.add(code) }
  }
  // Common ISO-639-2/3 languages that do not have a two-letter ISO-639-1 code.
  // This keeps African and regional language coverage from being limited to
  // the two-letter catalogue.
  const extraCodes = ['gaa','pcm','kri','ber','kab','din','luo','nso','tsn','ven','nya','sot','tiv','fon','wol','ful','srr','bem','lug','run','kin','lin','nde','sna','toi','umb','ach','ady','ava','che','chv','lez','sah','udm','kom','mhr','myv','alt','tuk','uzb','kaz','kir','tgk','mon','bod','uig','pus','kur','ckb','syr','arc','amh','tir']
  for (const code of extraCodes) {
    if (seen.has(code)) continue
    const name = display.of(code)
    if (name && name.toLowerCase() !== code) out.push({ code, name })
  }
  return out.sort((a,b) => a.name.localeCompare(b.name))
}

export function LanguageSelect({ name = 'language', defaultValue = 'en', autoTranslate = true, useStored = true, persist = false }: { name?: string; defaultValue?: string; autoTranslate?: boolean; useStored?: boolean; persist?: boolean }) {
  const [value, setValue] = useState(defaultValue || 'en')
  const options = useMemo(() => languageOptions(typeof navigator === 'undefined' ? 'en' : navigator.language), [])

  useEffect(() => {
    if (!useStored) return
    const stored = localStorage.getItem('wtc-language')
    if (stored && options.some(o => o.code === stored)) setValue(stored)
  }, [options, useStored])

  const change = (next: string) => {
    setValue(next)
    if (autoTranslate) {
      localStorage.setItem('wtc-language', next)
      localStorage.setItem('wtc-auto-translate', '1')
      window.dispatchEvent(new Event('wtc-language-change'))
    }
    if (persist) {
      void fetch('/api/preferences/display', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ language: next, autoTranslate }),
      }).catch(() => {})
    }
  }

  return <select name={name} value={value} onChange={e => change(e.target.value)} required>
    {options.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
  </select>
}
