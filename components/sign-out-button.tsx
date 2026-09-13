'use client'

import { useState } from 'react'

/* Sign-out is one tap away everywhere, but always confirmed first so a
   stray tap on a phone does not end the session. Posts to /auth/signout. */
export function SignOutButton({ className = 'button button-outline signout-button', label = 'Sign out' }: { className?: string; label?: string }) {
  const [busy, setBusy] = useState(false)
  return <form action="/auth/signout" method="post" onSubmit={e => { if (!confirm('Sign out of WTC Accra Hub?')) { e.preventDefault(); return } setBusy(true) }}>
    <button className={className} type="submit" disabled={busy} aria-label={label}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></svg>
      <span>{busy ? 'Signing out…' : label}</span>
    </button>
  </form>
}
