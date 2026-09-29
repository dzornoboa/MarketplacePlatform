'use client'

import { useMemo, useState } from 'react'

function calculateAge(value: string) {
  if (!value) return ''
  const dob = new Date(value + 'T00:00:00Z')
  if (Number.isNaN(dob.getTime())) return ''
  const now = new Date()
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const month = now.getUTCMonth() - dob.getUTCMonth()
  if (month < 0 || (month === 0 && now.getUTCDate() < dob.getUTCDate())) age--
  return age >= 0 ? String(age) : ''
}

export function ProfileBirthDateFields({ initialValue }: { initialValue: string | null }) {
  const [value, setValue] = useState(initialValue ?? '')
  const age = useMemo(() => calculateAge(value), [value])
  const today = new Date()
  const max = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate())).toISOString().slice(0, 10)

  return <div className="form-grid">
    <label>Date Of Birth
      <input name="dateOfBirth" type="date" autoComplete="bday" value={value} max={max} onChange={event => setValue(event.target.value)} required />
    </label>
    <label>Age
      <input value={age} readOnly aria-label="Age calculated from date of birth" />
    </label>
  </div>
}
