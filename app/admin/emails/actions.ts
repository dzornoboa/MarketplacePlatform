'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/lib/auth/guards'
import { adminClient, drainEmails, drainPushes } from '@/lib/notifications/worker'

/* Manual trigger for admins to drain the queue on demand — the same worker
   the DB wakes automatically after every insert, and the pg_cron safety net
   calls every 2 minutes. Useful for testing delivery right after adding
   SMTP / VAPID env vars, without waiting for the next event. */
export async function sendQueuedNow() {
  await requireAdminProfile()
  const admin = adminClient()
  if (!admin) redirect('/admin/emails?error=' + encodeURIComponent('SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.'))

  const [emails, pushes] = await Promise.all([drainEmails(admin), drainPushes(admin)])
  revalidatePath('/admin/emails')

  const parts = [`${emails.sent}/${emails.attempted} emails sent${emails.note ? ` (${emails.note})` : ''}`,
    `${pushes.sent}/${pushes.attempted} pushes sent${pushes.note ? ` (${pushes.note})` : ''}`]
  redirect('/admin/emails?message=' + encodeURIComponent(parts.join(' · ')))
}

/* Proves the mailbox works end to end: queues a message to the signed-in
   administrator and drains it immediately, reporting the SMTP error verbatim
   when the server refuses it. */
export async function sendTestEmail() {
  const { supabase, profile } = await requireAdminProfile()
  const { data: address } = await supabase.rpc('member_email', { target_user: profile.id })
  if (!address) redirect('/admin/emails?error=' + encodeURIComponent('No email address on your account.'))
  const admin = adminClient()
  if (!admin) redirect('/admin/emails?error=' + encodeURIComponent('SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.'))

  const stamp = new Date().toISOString()
  const { data: row, error } = await admin.from('outbound_emails').insert({
    to_email: address, to_user_id: profile.id, kind: 'test',
    subject: `WTC Accra Hub email test · ${stamp.slice(11, 19)} UTC`,
    body: `This is a delivery test from the WTC Accra Hub console.\n\nIf you are reading it, outbound email is working: members receive registration, payment, renewal, verification and support messages.\n\nSent ${stamp}`,
  }).select('id').single()
  if (error || !row) redirect('/admin/emails?error=' + encodeURIComponent(error?.message ?? 'Could not queue the test.'))

  const result = await drainEmails(admin)
  const { data: after } = await admin.from('outbound_emails').select('status,error').eq('id', row.id).maybeSingle()
  revalidatePath('/admin/emails')
  if (after?.status === 'sent') redirect('/admin/emails?status=sent&message=' + encodeURIComponent(`Test email sent to ${address}. Check the inbox (and spam) to confirm delivery.`))
  redirect('/admin/emails?status=failed&error=' + encodeURIComponent(after?.error ?? result.note ?? 'The test is still queued — SMTP is not configured on this deployment.'))
}
