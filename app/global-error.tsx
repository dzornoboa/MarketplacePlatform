'use client'

import { useEffect } from 'react'

/* Last resort. app/error.tsx cannot catch a failure in the root layout itself,
   so without this file such a failure left the visitor with a blank page. This
   replaces the root layout, so it brings its own html and body. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <html lang="en">
    <body style={{ fontFamily: 'Segoe UI, Arial, sans-serif', color: '#1d2733', background: '#fff', margin: 0, padding: '48px 24px' }}>
      <main style={{ maxWidth: 560, margin: '0 auto' }}>
        <p style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#E4580A', fontWeight: 800, margin: '0 0 6px' }}>World Trade Centre Accra</p>
        <h1 style={{ fontSize: 22, color: '#154074', margin: '0 0 12px' }}>WTC Accra Hub is temporarily unavailable</h1>
        <p style={{ lineHeight: 1.55, margin: '0 0 16px' }}>Something went wrong while loading the site. Please try again in a moment.</p>
        {error.digest && <p style={{ fontSize: 12.5, color: '#5b6470' }}>Reference: <code>{error.digest}</code></p>}
        <button
          type="button"
          onClick={reset}
          style={{ background: '#154074', color: '#fff', border: 0, borderRadius: 6, padding: '11px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
        >Try again</button>
        <p style={{ margin: '22px 0 0', fontSize: 12.5, color: '#5b6470', borderTop: '1px solid #e3e7ec', paddingTop: 12 }}>World Trade Centre Accra · +233 302 631 437 · membership@wtcaccra.com</p>
      </main>
    </body>
  </html>
}
