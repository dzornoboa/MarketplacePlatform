import { requireUserProfile } from '@/lib/auth/guards'
import { SubmitButton } from '@/components/submit-button'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { openRequest, replyToRequest } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SupportPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const { data: requests } = await supabase.from('support_requests').select('*').order('updated_at', { ascending: false })
  const requestIds = (requests ?? []).map(r => r.id)
  const { data: messages } = requestIds.length
    ? await supabase.from('support_messages').select('*').in('support_request_id', requestIds).order('created_at')
    : { data: [] }

  const authorIds = [...new Set((messages ?? []).map(m => m.author_id))]
  const { data: authors } = authorIds.length
    ? await supabase.from('profiles').select('id,full_name,system_role').in('id', authorIds)
    : { data: [] }
  const authorById = new Map((authors ?? []).map(a => [a.id, a]))

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Support</p>
      <h1>WTC Accra platform support</h1>
      <p className="muted">Raising a request here gives the team your account and verification history, so they can answer without asking you to repeat it.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card">
      <h2>Before contacting support</h2>
      <p className="muted">Check your Profile and Verification pages first. If WTC Accra requested changes, the reviewer note appears in your verification history.</p>
    </section>

    <form action={openRequest} className="card form-stack">
      <h2>Open a request</h2>
      <label>Subject<input name="subject" minLength={3} maxLength={180} required placeholder="Short summary" /></label>
      <div className="form-grid">
        <label>Category
          <select name="category" defaultValue="general">
            <option value="general">General</option>
            <option value="verification">Verification</option>
            <option value="marketplace">Marketplace and listings</option>
            <option value="billing">Billing and subscriptions</option>
            <option value="technical">Technical problem</option>
          </select>
        </label>
        <label>Priority
          <select name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>
      <label>Details<textarea name="body" rows={5} maxLength={5000} required placeholder="What you were doing, what happened, and what you expected." /></label>
      <SubmitButton>Open request</SubmitButton>
    </form>

    {(requests ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>No support requests</h2><p>Anything you raise will appear here with the team&rsquo;s replies.</p></section>
      : (requests ?? []).map(request => {
          const thread = (messages ?? []).filter(m => m.support_request_id === request.id)
          const closed = request.status === 'resolved' || request.status === 'closed'
          return <section className="card" key={request.id}>
            <div className="review-head">
              <div><h2>{request.subject}</h2><p>{humanize(request.category)} · {humanize(request.priority)} priority · opened {dateTime(request.created_at)}</p></div>
              <span className={`status-dot status-support-${request.status}`}>{humanize(request.status)}</span>
            </div>
            <div className="thread">{thread.map(entry => {
              const author = authorById.get(entry.author_id)
              const staff = !!author && author.system_role !== 'user'
              return <article className={staff ? 'thread-message thread-staff' : 'thread-message'} key={entry.id}>
                <header>
                  <strong>{entry.author_id === profile.id ? 'You' : author?.full_name ?? 'WTC Accra'}</strong>
                  {staff && entry.author_id !== profile.id && <span className="thread-badge">WTC Accra</span>}
                  <time>{dateTime(entry.created_at)}</time>
                </header>
                <p>{entry.body}</p>
              </article>
            })}</div>
            {!closed && <form action={replyToRequest} className="form-stack">
              <input type="hidden" name="requestId" value={request.id} />
              <label>Reply<textarea name="body" rows={3} maxLength={5000} required /></label>
              <button className="button button-secondary" type="submit">Send reply</button>
            </form>}
            {closed && <p className="field-help">This request is {humanize(request.status)}. Open a new request if you need more help.</p>}
          </section>
        })}
  </div>
}
