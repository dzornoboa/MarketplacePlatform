'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(path: string, key: 'error' | 'message', message: string) {
  return `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(message)}`
}

const INTENTS = new Set(['connect', 'invest', 'buy', 'partner'])

/* request_connection() is SECURITY DEFINER and does the copying: it notifies
   both members and every administrator, and queues an email to all of them
   carrying the deal summary and the process. A member cannot connect without
   that record being created. */
export async function requestConnection(formData: FormData) {
  const addressee = String(formData.get('addressee') ?? '')
  const intent = String(formData.get('intent') ?? 'connect')
  const opportunityId = String(formData.get('opportunityId') ?? '').trim() || null
  const note = String(formData.get('note') ?? '').trim()
  const returnTo = String(formData.get('returnTo') ?? '/dashboard/network')

  if (!addressee) redirect(back(returnTo, 'error', 'Choose a member to connect with.'))
  if (!INTENTS.has(intent)) redirect(back(returnTo, 'error', 'Choose a valid request type.'))
  if (note.length > 2000) redirect(back(returnTo, 'error', 'Keep your message under 2000 characters.'))

  const supabase = await createClient()
  const { error } = await supabase.rpc('request_connection', {
    addressee, connection_intent: intent, opportunity: opportunityId, note: note || null,
  })
  if (error) redirect(back(returnTo, 'error', error.message))

  revalidatePath('/dashboard/network')
  revalidatePath('/dashboard/feed')
  redirect(back(returnTo, 'message', 'Request sent. Both you and WTC Accra have been copied on it.'))
}

export async function respondToConnection(formData: FormData) {
  const connectionId = String(formData.get('connectionId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('responseNote') ?? '').trim()
  if (!connectionId || !['accept', 'decline', 'withdraw'].includes(decision)) {
    redirect(back('/dashboard/network', 'error', 'Invalid response.'))
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('respond_to_connection', {
    connection_id: connectionId, decision, response_note: note || null,
  })
  if (error) redirect(back('/dashboard/network', 'error', error.message))
  revalidatePath('/dashboard/network')
  redirect(back('/dashboard/network', 'message', 'Response recorded.'))
}

export async function toggleFollow(formData: FormData) {
  const target = String(formData.get('target') ?? '')
  const returnTo = String(formData.get('returnTo') ?? '/dashboard/network')
  if (!target) redirect(back(returnTo, 'error', 'Member not found.'))
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('toggle_follow', { target_user: target })
  if (error) redirect(back(returnTo, 'error', error.message))
  revalidatePath('/dashboard/feed')
  revalidatePath('/dashboard/network')
  redirect(back(returnTo, 'message', data ? 'Following. Their listings will appear in your feed.' : 'Unfollowed.'))
}
