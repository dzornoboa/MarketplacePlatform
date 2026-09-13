'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* Posts into a deal room; post_deal_room_message() checks membership and
   that the room is still open, then notifies the other participants. */
export async function postMessage(formData: FormData) {
  const roomId = String(formData.get('roomId') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  const target = `/dashboard/deal-rooms/${roomId}`
  if (!roomId) redirect('/dashboard/deal-rooms')
  if (!body) redirect(`${target}?error=${encodeURIComponent('Write a message first.')}`)
  const supabase = await createClient()
  const { error } = await supabase.rpc('post_deal_room_message', { room: roomId, message_body: body.slice(0, 5000) })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath(target)
  redirect(target)
}
