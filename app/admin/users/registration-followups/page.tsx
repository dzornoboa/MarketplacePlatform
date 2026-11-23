import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { requireCapability } from '@/lib/auth/guards'
import { labelForParticipantType } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRegistrationReminder } from './actions'

const messages: Record<string, string> = {
  queued: 'Reminder queued. Check Emails for delivery status.',
  'already-queued': 'A reminder has already been queued or sent for this attempt.',
  failed: 'The reminder could not be queued. Try again.',
  unavailable: 'This registration attempt is no longer available.',
}

export default async function RegistrationFollowupsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireCapability('users')
  const { status } = await searchParams
  const { data, error } = await createAdminClient().from('registration_followups')
    .select('id,email,full_name,participant_type,updated_at')
    .gte('updated_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
    .order('updated_at', { ascending: false }).limit(100)

  return <div className="page-stack">
    <Link href="/admin/users" className="arrow-link">← Members and access</Link>
    <h1>Registration follow-ups</h1>
    <p className="muted">Up to 100 recent applicants whose signup submission encountered a service error.</p>
    {status && Object.hasOwn(messages, status) && <p role="status">{messages[status]}</p>}
    {error && <p role="alert">Could not load registration attempts. Refresh to try again.</p>}
    {!error && !data?.length && <p>No incomplete attempts recorded in the last 30 days.</p>}
    {data?.map(attempt => <article key={attempt.id} className="card review-card">
      <h2>{attempt.full_name}</h2>
      <p><a href={`mailto:${encodeURIComponent(attempt.email)}`}>{attempt.email}</a></p>
      <p>{labelForParticipantType(attempt.participant_type)} · {new Date(attempt.updated_at).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</p>
      <form action={sendRegistrationReminder}>
        <input type="hidden" name="id" value={attempt.id} />
        <SubmitButton pendingLabel="Queuing…">Queue reminder</SubmitButton>
      </form>
    </article>)}
  </div>
}
