'use client'

import Link from 'next/link'
import { safeNextPath } from '@/lib/auth/redirects'
import { useEffect, useRef, useState } from 'react'
import { dateTime } from '@/lib/format'
import { bulkNotifications, markSeen } from '@/app/dashboard/notifications/actions'

type Item = { id: string; kind: string; title: string; body: string | null; href: string | null; created_at: string; read_at: string | null }

/* Notifications with tick boxes: select some or all, then delete or mark
   read/unread in one go. "Delete all" clears everything after a confirm. */
export function NotificationList({ items }: { items: Item[] }) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  /* The rows are on screen, so they count as seen and the badge stops counting
     them. Mark unread puts any of them back. */
  const seenSent = useRef(false)
  useEffect(() => {
    if (seenSent.current) return
    const unread = items.filter(item => !item.read_at).map(item => item.id)
    if (unread.length === 0) return
    seenSent.current = true
    void markSeen(unread).catch(() => { seenSent.current = false })
  }, [items])

  const all = picked.size === items.length && items.length > 0
  const toggle = (id: string) => setPicked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleAll = () => setPicked(all ? new Set() : new Set(items.map(i => i.id)))
  const confirmBulk = (e: React.FormEvent<HTMLFormElement>) => {
    const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value')
    if (action === 'delete_all' && !confirm('Delete every notification? This cannot be undone.')) e.preventDefault()
    if (action === 'delete' && !confirm(`Delete ${picked.size} notification${picked.size === 1 ? '' : 's'}?`)) e.preventDefault()
  }

  return <form action={bulkNotifications} onSubmit={confirmBulk}>
    <div className="bulk-bar card">
      <label className="switch"><input type="checkbox" checked={all} onChange={toggleAll} aria-label="Select all" /> {all ? 'Clear selection' : 'Select all'}{picked.size > 0 && <span className="muted"> · {picked.size} selected</span>}</label>
      <div className="button-row">
        <button className="button button-outline" name="bulk" value="read" type="submit" disabled={picked.size === 0}>Mark read</button>
        <button className="button button-outline" name="bulk" value="unread" type="submit" disabled={picked.size === 0}>Mark unread</button>
        <button className="button button-danger" name="bulk" value="delete" type="submit" disabled={picked.size === 0}>Delete selected</button>
        <button className="button button-danger" name="bulk" value="delete_all" type="submit">Delete all</button>
      </div>
    </div>
    <div className="notification-list">{items.map(item => {
      const href = safeNextPath(item.href, '')
      return <article className={`card notification${item.read_at ? '' : ' notification-unread'}${picked.has(item.id) ? ' notification-picked' : ''}`} key={item.id}>
        <label className="notification-pick"><input type="checkbox" name="ids" value={item.id} checked={picked.has(item.id)} onChange={() => toggle(item.id)} aria-label={`Select ${item.title}`} /></label>
        <div>
          <span className="eyebrow">{item.kind.replaceAll('_', ' ')}</span>
          <strong>{item.title}</strong>
          {item.body && <p className="muted">{item.body}</p>}
        </div>
        <div className="notification-meta">
          <span>{dateTime(item.created_at)}</span>
          {href && <Link className="arrow-link" href={href} prefetch={false}>Open →</Link>}
        </div>
      </article>
    })}</div>
  </form>
}
