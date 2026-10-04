'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/* Without this boundary a failure while rendering a dashboard page bubbled to
   the root, and during a client-side navigation the member was left looking at
   the loading skeleton with no way to tell that anything had gone wrong. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <section className="card empty-state error-page">
    <p className="eyebrow">Something went wrong</p>
    <h1>This page could not be loaded</h1>
    <p className="muted">The rest of your dashboard is still working. Try again, and if it keeps happening send the reference below to WTC Accra support.</p>
    {error.digest && <p className="field-help">Reference: <code>{error.digest}</code></p>}
    <div className="button-row">
      <button className="button button-primary" type="button" onClick={reset}>Try again</button>
      <Link className="button button-outline" href="/dashboard">Dashboard home</Link>
      <Link className="button button-outline" href="/dashboard/support">Contact support</Link>
    </div>
  </section>
}
