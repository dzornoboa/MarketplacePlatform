'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/* The public pages are statically cached, so the server-rendered header cannot
   see the visitor's cookies and always showed "Sign in". That read as being
   logged out. This swaps the actions once the browser confirms a session,
   without making the public pages dynamic. */
type State = 'unknown' | 'anonymous' | 'member'

export function HeaderSession({ variant = 'inline' }: { variant?: 'inline' | 'menu' }) {
  const [state, setState] = useState<State>('unknown')

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setState(data.session ? 'member' : 'anonymous')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? 'member' : 'anonymous')
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  if (state === 'member') {
    return variant === 'menu'
      ? <>
          <Link className="button button-primary" href="/dashboard">Open my dashboard</Link>
          <Link className="button button-outline" href="/dashboard/feed">Live listings</Link>
        </>
      : <>
          <Link className="text-link" href="/dashboard/feed">Live listings</Link>
          <Link className="button button-primary" href="/dashboard">My dashboard</Link>
        </>
  }

  // Anonymous, or not yet known — the same default the static HTML rendered.
  return variant === 'menu'
    ? <>
        <Link className="button button-outline" href="/login">Sign in</Link>
        <Link className="button button-primary" href="/register">Join the network</Link>
      </>
    : <>
        <Link className="text-link" href="/login">Sign in</Link>
        <Link className="button button-primary" href="/register">Join the network</Link>
      </>
}
