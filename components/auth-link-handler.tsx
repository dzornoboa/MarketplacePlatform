'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* Supabase hands auth results back in three shapes, and two of them never
   reach the server:

   - `#access_token=…&refresh_token=…` — the implicit flow, which is what
     invitations and links sent from the Supabase dashboard produce. The
     tokens are complete on their own, so the session is set right here. This
     works in any browser, which matters because invited people open the link
     on a device that never started the flow.
   - `#error=…` — a refusal (expired, already used, revoked).
   - `?code=` / `?token_hash=` — handled on the server by /auth/confirm.

   Without this, an invitation opened on a phone landed on the marketing site
   with the tokens stranded in the hash. */
export function AuthLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    const { hash, search, pathname } = window.location
    const fromHash = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
    const fromQuery = new URLSearchParams(search)

    const accessToken = fromHash.get('access_token')
    const refreshToken = fromHash.get('refresh_token')
    const type = fromHash.get('type') ?? fromQuery.get('type')

    if (accessToken && refreshToken) {
      window.history.replaceState(null, '', pathname)
      const destination = type === 'recovery' ? '/reset-password'
        : type === 'invite' ? '/set-password'
        : type === 'email_change' ? '/dashboard/settings'
        : '/dashboard'
      createClient().auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) router.replace(`/login?error=${encodeURIComponent('That link could not be completed. Request a new one.')}`)
          else router.replace(destination)
          router.refresh()
        })
      return
    }

    // Already on the handler route: the server component owns it.
    if (pathname === '/auth/confirm') return

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
