'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function reviewIntroduction(formData: FormData) {
  const id = String(formData.get('introductionId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const status = String(formData.get('status') ?? 'requested')
  const note = String(formData.get('note') ?? '').trim()
  const meetingAt = String(formData.get('meetingAt') ?? '').trim()
  const meetingUrl = String(formData.get('meetingUrl') ?? '').trim()
  const target = `/admin/introductions?status=${encodeURIComponent(status)}`
  if (!id || !['approve', 'introduce', 'schedule', 'complete', 'decline'].includes(decision)) redirect(`${target}&error=${encodeURIComponent('Invalid decision.')}`)
  if (decision === 'schedule' && !meetingAt) redirect(`${target}&error=${encodeURIComponent('Set the meeting date and time to schedule.')}`)
  if (meetingUrl && !/^https:\/\//.test(meetingUrl)) redirect(`${target}&error=${encodeURIComponent('Meeting link must start with https://.')}`)
  const supabase = await createClient()
  const { error } = await supabase.rpc('review_introduction', {
    introduction_id: id, decision, staff_note: note || null,
    meeting_at: meetingAt ? new Date(meetingAt).toISOString() : null, meeting_url: meetingUrl || null,
  })
  if (error) redirect(`${target}&error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/introductions'); revalidatePath('/dashboard/introductions')
  redirect(`${target}&message=${encodeURIComponent(`Introduction ${decision === 'approve' ? 'approved' : decision === 'introduce' ? 'marked introduced' : decision === 'schedule' ? 'scheduled' : decision === 'complete' ? 'completed' : 'declined'}. Both parties notified.`)}`)
}
