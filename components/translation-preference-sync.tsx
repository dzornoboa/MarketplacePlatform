'use client'

import { useEffect } from 'react'

export function TranslationPreferenceSync({ language, enabled }: { language: string; enabled: boolean }) {
  useEffect(() => {
    localStorage.setItem('wtc-language', language || 'en')
    localStorage.setItem('wtc-auto-translate', enabled ? '1' : '0')
    window.dispatchEvent(new Event('wtc-language-change'))
  }, [language, enabled])
  return null
}
