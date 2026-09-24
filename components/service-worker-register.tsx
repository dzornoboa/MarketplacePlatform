'use client'

import { useEffect } from 'react'

/* Registers /sw.js on every page load. This alone asks nothing of the visitor
   and shows no prompt — it just makes push delivery possible once they opt in
   from Settings (components/push-notification-toggle.tsx). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* unsupported browser or blocked context; push just stays unavailable */ })
    }
  }, [])
  return null
}
