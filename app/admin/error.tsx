'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/* Staff console boundary: a failing console page keeps the navigation and says
   what happened instead of hanging on its skeleton. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <section className="card empty-state error-page">
    <p className="eyebrow">Something went wrong</p>
    <h1>This console page could not be loaded</h1>
    <p className="muted">Try again. If it keeps happening, quote the reference below.</p>
    {error.digest && <p className="field-help">Reference: <code>{error.digest}</code></p>}
    <div className="button-row">
      <button className="button button-primary" type="button" onClick={reset}>Try again</button>
      <Link className="button button-outline" href="/admin">Console home</Link>
    </div>
  </section>
}
