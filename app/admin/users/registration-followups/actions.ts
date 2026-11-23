'use server'

import { redirect } from 'next/navigation'
import { requireCapability } from '@/lib/auth/guards'
import { registrationFollowupUrl } from '@/lib/auth/registration-followups'
import { createAdminClient } from '@/lib/supabase/admin'

const page = '/admin/users/registration-followups'

export async function sendRegistrationReminder(formData: FormData) {
  await requireCapability('users')
  const id = String(formData.get('id') ?? '')
  if (!/^[a-f0-9-]{36}$/i.test(id)) redirect(page)
  const admin = createAdminClient()
  const { data, error } = await admin.from('registration_followups').select('id,email')
    .eq('id', id).gte('updated_at', new Date(Date.now() - 30 * 86_400_000).toISOString()).maybeSingle()
  if (error || !data) redirect(`${page}?status=unavailable`)

  const { error: queueError } = await admin.from('outbound_emails').insert({
    to_email: data.email,
    subject: 'Continue your WTC Accra Hub registration',
    body: `Hello,\n\nYou recently tried to create a WTC Accra Hub account. You can continue registration using this link, which expires in seven days:\n\n${registrationFollowupUrl(data.id)}\n\nIf you already have an account, use the Continue Registration link on the Hub to request account access. Reply to this email if you need help.\n\nWTC Accra Membership Team`,
    kind: 'registration_followup',
    related_id: data.id,
  })
  const status = queueError?.code === '23505' ? 'already-queued' : queueError ? 'failed' : 'queued'
  redirect(`${page}?status=${status}`)
}
