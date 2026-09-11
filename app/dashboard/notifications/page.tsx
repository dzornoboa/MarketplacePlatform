import Link from 'next/link'
import { requireUserProfile } from '@/lib/auth/guards'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { markAllRead } from './actions'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const { supabase } = await requireUserProfile()
  const { data: notifications } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
  const unread = (notifications ?? []).filter(n => !n.read_at).length

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Activity</p>
      <h1>Notifications</h1>
      <p className="muted">Verification decisions, marketplace access changes, subscription updates and deal-flow activity.</p>
    </div>

    {unread > 0 && <section className="listing-head card">
      <div><strong>{unread} unread</strong><p className="muted">Marking as read does not remove anything.</p></div>
      <form action={markAllRead}><button className="button button-outline" type="submit">Mark all read</button></form>
    </section>}

    {(notifications ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Nothing yet</h2><p>Account and deal-flow activity will appear here.</p></section>
      : <div className="notification-list">{(notifications ?? []).map(item =>
          <article className={`card notification${item.read_at ? '' : ' notification-unread'}`} key={item.id}>
            <div>
              <span className="eyebrow">{item.kind.replaceAll('_', ' ')}</span>
              <strong>{item.title}</strong>
              {item.body && <p className="muted">{item.body}</p>}
            </div>
            <div className="notification-meta">
              <span>{dateTime(item.created_at)}</span>
              {item.href && <Link className="arrow-link" href={item.href}>Open →</Link>}
            </div>
          </article>)}</div>}
  </div>
}
