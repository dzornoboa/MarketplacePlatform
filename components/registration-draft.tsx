'use client'

import { useEffect } from 'react'

const KEY = 'wtc-registration-draft'
const DRAFT_FIELDS = new Set([
  'country', 'countryCode', 'investmentBand', 'locale', 'participantType',
  'phoneCountryCode', 'planCode', 'preferredCurrency', 'timezone',
])

export function RegistrationDraft() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>('form[data-registration-form]')
    if (!form) return

    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string,string>
      const draft = Object.entries(saved).filter(([name, value]) => DRAFT_FIELDS.has(name) && typeof value === 'string')
      localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(draft)))
      for (const [name, value] of draft) {
        const field = form.elements.namedItem(name)
        if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) continue
        if (field.type === 'password' || field.type === 'file') continue
        const proto = field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
        setter?.call(field, value)
        field.dispatchEvent(new Event('input', { bubbles: true }))
        field.dispatchEvent(new Event('change', { bubbles: true }))
      }
    } catch { /* ignore stale browser data */ }

    const save = () => {
      const data: Record<string,string> = {}
      new FormData(form).forEach((value, key) => {
        if (typeof value === 'string' && DRAFT_FIELDS.has(key)) data[key] = value
      })
      try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* Browser storage can be disabled. */ }
    }
    form.addEventListener('input', save)
    form.addEventListener('change', save)
    return () => { form.removeEventListener('input', save); form.removeEventListener('change', save) }
  }, [])
  return null
}

export function ClearRegistrationDraft() {
  useEffect(() => { localStorage.removeItem(KEY) }, [])
  return null
}
