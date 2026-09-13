'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/* The public pages are statically cached, so the server-rendered header cannot
   see the visitor's cookies. This swaps the actions once the browser confirms
   a session, without making the public pages dynamic. "Live listings" is not
   repeated here — it is already in the database-driven main nav. */
type State = 'unknown' | 'anonymous' | 'member'

export function useSessionState(): State {
  const [state, setState] = useState<State>('unknown')
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => { if (!cancelled) setState(data.session ? 'member' : 'anonymous') })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setState(session ? 'member' : 'anonymous'))
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])
  return state
}

export function HeaderSession({ variant = 'inline' }: { variant?: 'inline' | 'menu' }) {
  const state = useSessionState()
  if (state === 'member') {
    return variant === 'menu'
      ? <>
          <Link className="button button-primary" href="/dashboard">Open my dashboard</Link>
          <form action="/auth/signout" method="post"><button className="button button-outline" type="submit">Sign out</button></form>
        </>
      : <>
          <Link className="button button-primary" href="/dashboard">My dashboard</Link>
          <form action="/auth/signout" method="post"><button className="link-button" type="submit">Sign out</button></form>
        </>
  }
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

/* Marketing calls-to-action on public pages. Anonymous visitors get the
   register/sign-in pair; a signed-in member gets a route into the platform
   instead of being told to join something they are already in. */
export function SessionCta({ primaryClass = 'button button-primary', secondaryClass = 'button button-outline',
  memberHref = '/dashboard/feed', memberLabel = 'Go to your dashboard' }: {
  primaryClass?: string; secondaryClass?: string; memberHref?: string; memberLabel?: string
}) {
  const state = useSessionState()
  if (state === 'member') return <div className="button-row"><Link className={primaryClass} href={memberHref}>{memberLabel}</Link></div>
  return <div className="button-row">
    <Link className={primaryClass} href="/register">Join the network</Link>
    <Link className={secondaryClass} href="/login">Member sign in</Link>
  </div>
}

/* Wraps server-rendered marketing CTAs. Anonymous visitors see the children
   exactly as rendered (register / sign in, from the database); a signed-in
   member sees a single route into the platform instead. */
export function MemberAware({ children, memberHref = '/dashboard', memberLabel = 'Go to your dashboard', memberClass = 'button button-primary' }:
  { children: ReactNode; memberHref?: string; memberLabel?: string; memberClass?: string }) {
  const state = useSessionState()
  if (state === 'member') return <div className="button-row"><Link className={memberClass} href={memberHref}>{memberLabel}</Link></div>
  return <>{children}</>
}
