import { requireUserProfile } from '@/lib/auth/guards'
import { BrandCircle } from '@/components/brand'
import { NotificationList } from '@/components/notification-list'
import { markAllRead } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function NotificationsPage({ searchParams }: Props) {
  const { supabase } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const { data: notifications } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
  const unread = (notifications ?? []).filter(n => !n.read_at).length

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Activity</p>
      <h1>Notifications</h1>
      <p className="muted">Verification decisions, marketplace access changes, subscription updates and deal-flow activity.</p>
    </div>

    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}
    {unread > 0 && <section className="listing-head card">
      <div><strong>{unread} unread</strong><p className="muted">Marking as read does not remove anything.</p></div>
      <form action={markAllRead}><button className="button button-outline" type="submit">Mark all read</button></form>
    </section>}

    {(notifications ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Nothing yet</h2><p>Account and deal-flow activity will appear here.</p></section>
      : <NotificationList items={notifications ?? []} />}
  </div>
}
