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


export async function closeDealRoom(formData: FormData) {
  const roomId = String(formData.get('roomId') ?? '')
  const value = Number(formData.get('dealValue') ?? 0)
  const currency = String(formData.get('currency') ?? 'USD').trim().toUpperCase()
  const note = String(formData.get('closeNote') ?? '').trim()
  const target = `/dashboard/deal-rooms/${roomId}`
  if (!roomId || !Number.isFinite(value) || value <= 0) redirect(`${target}?error=${encodeURIComponent('Enter the final closed deal value.')}`)
  if (!/^[A-Z]{3}$/.test(currency)) redirect(`${target}?error=${encodeURIComponent('Enter a valid 3-letter currency code.')}`)
  const supabase = await createClient()
  const { error } = await supabase.rpc('close_deal_room', {
    room_id: roomId,
    closed_value: value,
    closed_currency: currency,
    note: note || null,
  })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath(target)
  revalidatePath('/dashboard/deal-rooms')
  redirect(`${target}?message=${encodeURIComponent('Deal marked verified and closed. The 1% success fee has been calculated and recorded.')}`)
}
