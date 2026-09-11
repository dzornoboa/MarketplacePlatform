import { requireAdminProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const TABS = ['queued', 'sent', 'failed'] as const

/* Connection notices are written to outbound_emails by request_connection().
   Until custom SMTP is configured nothing can actually send, so this page is
   both the delivery backlog and the proof that the copy-to-WTC-Accra rule fired
   for every request. */
export default async function AdminEmailsPage({ searchParams }: Props) {
  const { supabase } = await requireAdminProfile()
  const params = await searchParams
  const status = typeof params.status === 'string' && TABS.includes(params.status as 'queued') ? params.status : 'queued'

  const { data: emails } = await supabase.from('outbound_emails').select('*')
    .eq('status', status).order('created_at', { ascending: false }).limit(100)

  const counts = await Promise.all(TABS.map(async tab => {
    const { count } = await supabase.from('outbound_emails').select('*', { count: 'exact', head: true }).eq('status', tab)
    return { status: tab, count: count ?? 0 }
  }))
  const queued = counts.find(c => c.status === 'queued')?.count ?? 0

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Delivery</p>
      <h1>Outbound email queue</h1>
      <p className="muted">Every connection request generates a copy for both members and all administrators. This is where those copies wait.</p>
    </div>

    {queued > 0 && <section className="restriction-banner">
      <div>
        <strong>{queued} {queued === 1 ? 'message is' : 'messages are'} waiting to send</strong>
        <p>This project is still on Supabase&rsquo;s default sender, which is capped at 2 emails per hour and cannot be raised. Configure custom SMTP and a worker can drain this backlog — nothing here is lost in the meantime.</p>
      </div>
    </section>}

    <nav className="queue-tabs">
      {counts.map(tab => <a key={tab.status} className={tab.status === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/admin/emails?status=${tab.status}`}>
        {humanize(tab.status)}<span>{tab.count}</span>
      </a>)}
    </nav>

    {(emails ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>Nothing {humanize(status)}</h2><p>Connection requests will appear here as members make them.</p></section>
      : <div className="review-list">{(emails ?? []).map(mail => <article className="card review-card" key={mail.id}>
          <div className="review-head">
            <div>
              <h2>{mail.subject}</h2>
              <p>To {mail.to_email} · {humanize(mail.kind)} · {dateTime(mail.created_at)}</p>
            </div>
            <span className={`status-dot status-mail-${mail.status}`}>{humanize(mail.status)}</span>
          </div>
          {mail.error && <p className="field-help">Last error: {mail.error}</p>}
          <details className="eoi-block">
            <summary>Message body</summary>
            <p className="prose mail-body">{mail.body}</p>
          </details>
        </article>)}</div>}
  </div>
}
