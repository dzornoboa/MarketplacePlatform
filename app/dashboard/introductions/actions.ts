'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const back = (key: 'error' | 'message', msg: string) => `/dashboard/introductions?${key}=${encodeURIComponent(msg)}`

/* A member asks WTC Accra to introduce them to a listing owner. The trade
   desk reviews it before either side is contacted (request_introduction). */
export async function requestIntroduction(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()
  if (!opportunityId) redirect(back('error', 'Choose the listing you want an introduction on.'))
  if (note.length > 2000) redirect(back('error', 'Keep the note under 2000 characters.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('request_introduction', { opportunity_id: opportunityId, request_note: note || null })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/introductions')
  redirect(back('message', 'Introduction requested. The WTC Accra trade desk will review it and arrange contact.'))
}
