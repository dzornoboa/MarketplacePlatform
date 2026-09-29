'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/* Every save redirects back with ?message= or ?error=. This shows that result
   as a centred pop-up the moment the page arrives, so the outcome is seen
   wherever the form was. Successes close themselves; errors wait for OK.
   The banner at the top of the page stays for reloads and screen readers. */
export function FlashNotice() {
  const params = useSearchParams()
  const message = params.get('message')
  const error = params.get('error')
  const text = error ?? message
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    setOpen(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('message')
    url.searchParams.delete('error')
    url.searchParams.delete('section')
    window.history.replaceState(window.history.state, '', url.pathname + (url.search || '') + url.hash)
  }, [])

  useEffect(() => {
    if (!text) return
    setOpen(true)
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(close, error ? 12000 : 5000)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [text, error, close])

  if (!text || !open) return null
  return <div className="flash-overlay" role="presentation" onClick={close}>
    <div className={`flash-dialog ${error ? 'flash-error' : 'flash-success'}`} role="alertdialog" aria-modal="true" aria-live="assertive" onClick={e => e.stopPropagation()}>
      <span className="flash-icon" aria-hidden="true">{error ? '!' : '✓'}</span>
      <div>
        <strong>{error ? 'Something needs attention' : 'Done'}</strong>
        <p>{text}</p>
      </div>
      <button type="button" className="flash-close" aria-label="Close notification" onClick={close}>×</button>
      <button type="button" className="button button-primary" onClick={close} autoFocus>OK</button>
    </div>
  </div>
}
