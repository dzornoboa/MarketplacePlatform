'use client'

import { useState } from 'react'

/* Inputs that format as the member types. The formatted value is what the
   form submits; the server strips spaces and slashes before validating. */

const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max)

export function CardNumberInput({ name = 'cardNumber', required = false, placeholder = '1234 5678 9012 3456', autoComplete = 'cc-number' }: { name?: string; required?: boolean; placeholder?: string; autoComplete?: string }) {
  const [value, setValue] = useState('')
  const format = (raw: string) => {
    const d = digits(raw, 19)
    // American Express groups 4-6-5; everything else 4-4-4-4(-3)
    if (/^3[47]/.test(d)) return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ')
    return d.replace(/(.{4})/g, '$1 ').trim()
  }
  return <input name={name} value={value} onChange={e => setValue(format(e.target.value))} inputMode="numeric" autoComplete={autoComplete} placeholder={placeholder} required={required} maxLength={23} spellCheck={false} />
}

export function ExpiryInput({ name = 'expiry', required = false }: { name?: string; required?: boolean }) {
  const [value, setValue] = useState('')
  const format = (raw: string) => {
    let d = digits(raw, 4)
    if (d.length === 1 && Number(d) > 1) d = '0' + d          // "5" → "05"
    if (d.length >= 2 && Number(d.slice(0, 2)) > 12) d = '12' + d.slice(2)
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d
  }
  return <input name={name} value={value} onChange={e => setValue(format(e.target.value))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" required={required} maxLength={7} />
}

export function CvcInput({ name = 'cvc', required = false }: { name?: string; required?: boolean }) {
  const [value, setValue] = useState('')
  return <input name={name} value={value} onChange={e => setValue(digits(e.target.value, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="123" required={required} maxLength={4} />
}

/* Ghana mobile numbers read as 024 000 0000; international numbers keep their + prefix. */
export function PhoneInput({ name = 'phone', defaultValue = '', required = false, placeholder = '024 000 0000', autoComplete = 'tel' }: { name?: string; defaultValue?: string; required?: boolean; placeholder?: string; autoComplete?: string }) {
  const format = (raw: string) => {
    const plus = raw.trim().startsWith('+')
    const d = raw.replace(/\D/g, '').slice(0, 15)
    if (plus) return '+' + d.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}${d.length > 10 ? ' ' + d.slice(10) : ''}`
  }
  const [value, setValue] = useState(format(defaultValue))
  return <input name={name} value={value} onChange={e => setValue(format(e.target.value))} inputMode="tel" autoComplete={autoComplete} placeholder={placeholder} required={required} />
}
