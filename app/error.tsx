'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/* Route-level error boundary: keeps the brand chrome, offers retry, and
   surfaces the digest so support can find it in the Vercel logs. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <main className="center-page">
    <section className="card empty-state error-page">
      <p className="eyebrow">Something went wrong</p>
      <h1>We couldn’t load this page</h1>
      <p className="muted">Please try again. If it keeps happening, send the reference below to WTC Accra support.</p>
      {error.digest && <p className="field-help">Reference: <code>{error.digest}</code></p>}
      <div className="button-row">
        <button className="button button-primary" type="button" onClick={reset}>Try again</button>
        <Link className="button button-outline" href="/dashboard/support">Contact support</Link>
        <Link className="button button-outline" href="/">Home</Link>
      </div>
    </section>
  </main>
}
