'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/* Every save redirects back with ?message= or ?error=. Pages render that as a
   banner at the top; this mirrors it as a toast at the bottom of the screen
   so the outcome is visible without scrolling, wherever the form was. */
export function FlashNotice() {
  const params = useSearchParams()
  const message = params.get('message')
  const error = params.get('error')
  const text = error ?? message
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!text) return
    setOpen(true)
    const t = setTimeout(() => setOpen(false), error ? 12000 : 6000)
    return () => clearTimeout(t)
  }, [text, error])
  if (!text || !open) return null
  return <div className={`flash-notice ${error ? 'flash-error' : 'flash-success'}`} role="status" aria-live="polite">
    <span>{text}</span>
    <button type="button" aria-label="Dismiss" onClick={() => setOpen(false)}>×</button>
  </div>
}
