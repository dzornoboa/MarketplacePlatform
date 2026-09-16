'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'

function back(key: 'error' | 'message', message: string) {
  return `/dashboard/support?${key}=${encodeURIComponent(message)}`
}

const CATEGORIES = new Set(['general', 'verification', 'marketplace', 'billing', 'technical'])
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent'])

export async function openRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const subject = String(formData.get('subject') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const category = String(formData.get('category') ?? 'general')
  const priority = String(formData.get('priority') ?? 'normal')
  if (subject.length < 3 || subject.length > 180) redirect(back('error', 'Subject must be between 3 and 180 characters.'))
  if (body.length < 1 || body.length > 5000) redirect(back('error', 'Describe the issue in up to 5000 characters.'))
  if (!CATEGORIES.has(category)) redirect(back('error', 'Choose a category.'))
  if (!PRIORITIES.has(priority)) redirect(back('error', 'Choose a priority.'))

  if (!(await allow('support_ticket', 5, 3600))) redirect('/dashboard/support?error=' + encodeURIComponent('You have opened several requests recently. Please wait before opening another.'))
  const { data: request, error } = await supabase.from('support_requests')
    .insert({ user_id: String(userId), subject, category, priority })
    .select('id').single()
  if (error || !request) redirect(back('error', error?.message ?? 'Unable to open the request.'))

  const { error: messageError } = await supabase.from('support_messages')
    .insert({ support_request_id: request.id, author_id: String(userId), body })
  if (messageError) redirect(back('error', messageError.message))

  revalidatePath('/dashboard/support')
  redirect(back('message', 'Support request opened. The WTC Accra team will reply here.'))
}

export async function replyToRequest(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  if (!requestId) redirect(back('error', 'Request not found.'))
  if (body.length < 1 || body.length > 5000) redirect(back('error', 'Write a reply of up to 5000 characters.'))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { error } = await supabase.from('support_messages')
    .insert({ support_request_id: requestId, author_id: String(userId), body })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/support')
  redirect(back('message', 'Reply sent.'))
}
