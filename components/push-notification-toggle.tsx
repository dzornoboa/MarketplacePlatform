'use client'

import { useEffect, useState } from 'react'

type Status = 'checking' | 'unsupported' | 'ios-not-installed' | 'denied' | 'off' | 'on' | 'working'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

function isIosSafariNotInstalled() {
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  return isIos && !isStandalone
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setStatus('unsupported'); return }
      if (isIosSafariNotInstalled()) { setStatus('ios-not-installed'); return }
      if (Notification.permission === 'denied') { setStatus('denied'); return }
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (!cancelled) setStatus(sub ? 'on' : 'off')
      } catch { if (!cancelled) setStatus('off') }
    }
    check()
    return () => { cancelled = true }
  }, [])

  async function enable() {
    setError(null); setStatus('working')
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) throw new Error('Push is not configured on this deployment yet.')
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus(permission === 'denied' ? 'denied' : 'off'); return }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
      const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Could not save this device.')
      setStatus('on')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable notifications.')
      setStatus('off')
    }
  }

  async function disable() {
    setError(null); setStatus('working')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
        await sub.unsubscribe()
      }
      setStatus('off')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn off notifications.')
      setStatus('on')
    }
  }

  return <section className="card">
    <h2>Push notifications on this device</h2>
    <p className="muted">Get an alert on your phone the moment something happens — a new match, a reply, or a listing you follow going live.</p>
    {error && <div className="alert alert-error">{error}</div>}
    {status === 'checking' && <p className="field-help">Checking this device…</p>}
    {status === 'unsupported' && <p className="field-help">This browser doesn&rsquo;t support push notifications.</p>}
    {status === 'ios-not-installed' && <p className="field-help">On iPhone, tap Share → &ldquo;Add to Home Screen&rdquo; first, then open WTC Accra Hub from your home screen to turn this on.</p>}
    {status === 'denied' && <p className="field-help">Notifications are blocked for this site in your browser settings. Allow them there, then reload this page.</p>}
    {(status === 'off' || status === 'working') && <button className="button button-primary" type="button" onClick={enable} disabled={status === 'working'}>{status === 'working' ? 'Working…' : 'Enable notifications on this device'}</button>}
    {status === 'on' && <div className="button-row">
      <span className="status-dot status-mail-sent">Enabled on this device</span>
      <button className="button button-outline" type="button" onClick={disable}>Turn off on this device</button>
    </div>}
  </section>
}
