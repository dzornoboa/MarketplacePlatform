'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAnyCapability } from '@/lib/auth/guards'

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
  const meeting = meetingAt ? new Date(`${meetingAt}:00Z`) : null
  if (meeting && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(meetingAt)
    || !Number.isFinite(meeting.getTime()) || meeting.toISOString().slice(0, 16) !== meetingAt)) {
    redirect(`${target}&error=${encodeURIComponent('Enter a valid meeting date and time in UTC.')}`)
  }
  const { supabase } = await requireAnyCapability(['introductions', 'verification'])
  const { error } = await supabase.rpc('review_introduction', {
    introduction_id: id, decision, staff_note: note || null,
    meeting_at: meeting?.toISOString() ?? null, meeting_url: meetingUrl || null,
  })
  if (error) redirect(`${target}&error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/introductions'); revalidatePath('/dashboard/introductions')
  redirect(`${target}&message=${encodeURIComponent(`Introduction ${decision === 'approve' ? 'approved' : decision === 'introduce' ? 'marked introduced' : decision === 'schedule' ? 'scheduled' : decision === 'complete' ? 'completed' : 'declined'}. Both parties notified.`)}`)
}
