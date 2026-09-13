'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* review_bid() does the work: clearing moves the bid to the owner and copies
   both parties in-app and by email; rejecting tells the bidder and stops it. */
export async function reviewBid(formData: FormData) {
  const bidId = String(formData.get('bidId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('reviewNote') ?? '').trim()
  const target = '/admin/bids'
  if (!bidId || !['clear', 'reject'].includes(decision)) {
    redirect(`${target}?error=${encodeURIComponent('Invalid bid decision.')}`)
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('review_bid', { bid_id: bidId, decision, review_note: note || null })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/bids')
  revalidatePath('/dashboard/interests')
  redirect(`${target}?message=${encodeURIComponent(decision === 'clear' ? 'Bid cleared. Both parties have been notified and copied.' : 'Bid rejected. The bidder has been told.')}`)
}
