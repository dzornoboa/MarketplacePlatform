'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed'])

function back(key: 'error' | 'message', message: string) {
  return `/admin/support?${key}=${encodeURIComponent(message)}`
}

export async function replyAsStaff(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  const status = String(formData.get('status') ?? '')
  if (!requestId) redirect(back('error', 'Request not found.'))
  if (body.length < 1 || body.length > 5000) redirect(back('error', 'Write a reply of up to 5000 characters.'))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { error } = await supabase.from('support_messages')
    .insert({ support_request_id: requestId, author_id: String(userId), body })
  if (error) redirect(back('error', error.message))

  if (status && STATUSES.has(status)) {
    const { error: statusError } = await supabase.from('support_requests')
      .update({ status: status as 'open' }).eq('id', requestId)
    if (statusError) redirect(back('error', statusError.message))
  }

  revalidatePath('/admin/support')
  revalidatePath('/dashboard/support')
  redirect(back('message', 'Reply sent to the member.'))
}

export async function assignToMe(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '')
  if (!requestId) redirect(back('error', 'Request not found.'))
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { error } = await supabase.from('support_requests')
    .update({ assigned_to: String(userId), status: 'in_progress' }).eq('id', requestId)
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/support')
  redirect(back('message', 'Request assigned to you.'))
}
