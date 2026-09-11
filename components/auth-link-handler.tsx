'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* Supabase can return auth results in the URL *hash* (`#error=...`,
   `#access_token=...`). A hash never reaches the server, so a failed reset
   link used to land on the home page with the error invisible — the user just
   saw the marketing site, or a dead localhost page.
   This picks those up on any route and forwards them to /auth/confirm, which
   turns them into a readable message on the page that can fix the problem. */
export function AuthLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    const { hash, search, pathname } = window.location
    // Already on the handler route: the server component owns it.
    if (pathname === '/auth/confirm') return

    const fromHash = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
    const fromQuery = new URLSearchParams(search)

    /* Only Supabase-shaped payloads are actionable. A bare `?error=` in the
       query is this app's own human-readable message — forwarding that would
       bounce the user in a loop and replace a useful message with a generic one. */
    const errorCode = fromHash.get('error_code') ?? fromQuery.get('error_code') ?? fromHash.get('error')
    const code = fromHash.get('code') ?? fromQuery.get('code')
    const tokenHash = fromHash.get('token_hash') ?? fromQuery.get('token_hash')
    if (!errorCode && !code && !tokenHash) return

    const forward = new URLSearchParams()
    for (const key of ['error', 'error_code', 'error_description', 'code', 'token_hash', 'type', 'next']) {
      const value = fromHash.get(key) ?? fromQuery.get(key)
      if (value) forward.set(key, value)
    }

    // Strip the credentials out of the address bar before navigating away.
    window.history.replaceState(null, '', pathname)
    router.replace(`/auth/confirm?${forward.toString()}`)
  }, [router])

  return null
}
