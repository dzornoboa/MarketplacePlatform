'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const back = (key: 'error' | 'message', msg: string) => `/dashboard/introductions?${key}=${encodeURIComponent(msg)}`

/* A member requests access to a matched deal. WTC Accra reviews the request
   before a direct connection opens; approved requests receive a monitored Deal Room. */
export async function requestIntroduction(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()
  if (!opportunityId) redirect(back('error', 'Choose the deal you want access to.'))
  if (note.length > 2000) redirect(back('error', 'Keep the note under 2000 characters.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('request_introduction', { opportunity_id: opportunityId, request_note: note || null })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/introductions')
  redirect(back('message', 'Access request received. WTC Accra will review it, notify the monitored team and update the status here.'))
}


export async function withdrawIntroduction(formData: FormData) {
  const introductionId = String(formData.get('introductionId') ?? '').trim()
  if (!introductionId) redirect(back('error','Access request not found.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('withdraw_introduction', { introduction_id: introductionId })
  if (error) redirect(back('error',error.message))
  revalidatePath('/dashboard/introductions')
  revalidatePath('/admin/introductions')
  redirect(back('message','Access request withdrawn.'))
}
