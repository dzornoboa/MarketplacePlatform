'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function reviewDeal(formData: FormData) {
  const dealId = String(formData.get('dealId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('reviewNote') ?? '').trim()
  const target = '/admin/deals'
  if (!dealId || !['clear', 'reject'].includes(decision)) {
    redirect(`${target}?error=${encodeURIComponent('Invalid deal decision.')}`)
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('review_bid', { bid_id: dealId, decision, review_note: note || null })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/deals')
  revalidatePath('/dashboard/interests')
  redirect(`${target}?message=${encodeURIComponent(decision === 'clear' ? 'Deal request processed. The applicant, owner and monitored WTC Accra team have been notified.' : 'Deal request declined. The applicant and monitored WTC Accra team have been notified.')}`)
}
