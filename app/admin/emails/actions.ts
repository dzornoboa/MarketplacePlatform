'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/lib/auth/guards'
import { adminClient, drainEmails, drainPushes } from '@/lib/notifications/worker'

/* Manual trigger for admins to drain the queue on demand — the same worker
   the DB wakes automatically after every insert, and the pg_cron safety net
   calls every 2 minutes. Useful for testing delivery right after adding
   RESEND_API_KEY / VAPID env vars, without waiting for the next event. */
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
