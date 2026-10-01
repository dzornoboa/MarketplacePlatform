'use client'

import { useEffect, useMemo, useState } from 'react'

export function languageOptions(uiLocale = 'en') {
  const display = new Intl.DisplayNames([uiLocale], { type: 'language' })
  const out: { code: string; name: string }[] = []
  const seenCode = new Set<string>()
  const seenName = new Set<string>()

  /* Intl canonicalises a three-letter code onto its two-letter equivalent
     ('ava' -> 'av'), and returns the bare code when it has no name for it.
     Without these two guards the list showed raw codes like "av" and "bo", and
     every language with both code forms appeared twice ("Akan", "Akan"). */
  const add = (code: string) => {
    const canonical = code.toLowerCase()
    const name = display.of(canonical)
    if (!name) return
    if (/^[a-z]{2,3}$/i.test(name)) return            // a code, not a language name
    if (seenName.has(name)) return                    // same language under another code
    if (seenCode.has(canonical)) return
    seenCode.add(canonical); seenName.add(name)
    out.push({ code: canonical, name })
  }

  for (let a = 97; a <= 122; a++) for (let b = 97; b <= 122; b++) add(String.fromCharCode(a, b))

  // Languages with no two-letter ISO-639-1 code, so African and regional
  // coverage is not limited to the two-letter catalogue.
  for (const code of ['gaa','pcm','kri','ber','kab','din','luo','nso','tsn','ven','nya','sot','tiv','fon','wol','ful','srr','bem','lug','run','kin','lin','nde','sna','toi','umb','ach','ady','ava','che','chv','lez','sah','udm','kom','mhr','myv','alt','tuk','uzb','kaz','kir','tgk','mon','bod','uig','pus','kur','ckb','syr','arc','amh','tir']) add(code)

  return out.sort((a, b) => a.name.localeCompare(b.name))
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

  // Language names come from Intl in the reader's own language already.
  return <select name={name} value={value} onChange={e => change(e.target.value)} required data-no-translate>
    {options.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
  </select>
}
