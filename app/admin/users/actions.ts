'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string, userId?: string) {
  return `${userId ? `/admin/users/${userId}` : '/admin/users'}?${key}=${encodeURIComponent(message)}`
}

/* Forms on the member detail page carry returnTo=detail so the action lands back there. */
function target(formData: FormData) {
  return String(formData.get('returnTo') ?? '') === 'detail' ? String(formData.get('userId') ?? '') : undefined
}

/* Grants or revokes marketplace browsing and posting independently of
   verification, so a participant can be stopped from seeing other members'
   bids, or from posting their own, without suspending the account. */
export async function updateMarketplaceAccess(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const allowView = String(formData.get('allowView') ?? '') === 'on'
  const allowPost = String(formData.get('allowPost') ?? '') === 'on'
  const reason = String(formData.get('reason') ?? '').trim()
  if (!targetUser) redirect(back('error', 'User not found.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_participant_access', {
    target_user: targetUser, allow_view: allowView, allow_post: allowPost, reason: reason || null,
  })
  if (error) redirect(back('error', error.message, target(formData)))
  revalidatePath('/admin/users'); revalidatePath(`/admin/users/${targetUser}`)
  redirect(back('message', 'Marketplace access updated. The member is notified immediately.', target(formData)))
}

export async function updateAccountStatus(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const newStatus = String(formData.get('accountStatus') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()
  if (!targetUser || !['pending', 'active', 'suspended', 'disabled'].includes(newStatus)) {
    redirect(back('error', 'Invalid account status.'))
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_account_status', {
    target_user: targetUser, new_status: newStatus, reason: reason || null,
  })
  if (error) redirect(back('error', error.message, target(formData)))
  revalidatePath('/admin/users'); revalidatePath(`/admin/users/${targetUser}`)
  redirect(back('message', `Account status set to ${newStatus}.`, target(formData)))
}

export async function updateStaffRole(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const newRole = String(formData.get('systemRole') ?? '')
  if (!targetUser || !newRole) redirect(back('error', 'Invalid role change.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_staff_role', { target_user: targetUser, new_role: newRole })
  if (error) redirect(back('error', error.message, target(formData)))
  revalidatePath('/admin/users'); revalidatePath(`/admin/users/${targetUser}`)
  redirect(back('message', `Role updated to ${newRole.replaceAll('_', ' ')}.`, target(formData)))
}

/* Verify, un-verify or ask for changes after the initial review. */
export async function setVerificationStatus(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const newStatus = String(formData.get('verificationStatus') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  if (!targetUser || !['verified', 'changes_requested', 'rejected', 'pending_review', 'suspended'].includes(newStatus)) redirect(back('error', 'Invalid verification status.', targetUser || undefined))
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_verification_status', { target_user: targetUser, new_status: newStatus, note: note || null })
  if (error) redirect(back('error', error.message, targetUser))
  revalidatePath('/admin/users'); revalidatePath(`/admin/users/${targetUser}`); revalidatePath('/admin/verification')
  redirect(back('message', `Verification set to ${newStatus.replaceAll('_', ' ')}. The member has been notified.`, targetUser))
}

/* A direct message to the member: in-app notification + queued email. */
export async function messageMember(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const href = String(formData.get('href') ?? '').trim() || '/dashboard/notifications'
  if (!targetUser || !title || !body) redirect(back('error', 'A subject and a message are required.', targetUser || undefined))
  const supabase = await createClient()
  const { error } = await supabase.rpc('message_member', { target_user: targetUser, message_title: title, message_body: body, message_href: href })
  if (error) redirect(back('error', error.message, targetUser))
  revalidatePath(`/admin/users/${targetUser}`)
  redirect(back('message', 'Message sent. The member sees it in their dashboard and by email.', targetUser))
}

/* Finance: activate, extend, end or change a member's plan by hand. */
export async function setMemberSubscription(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const plan = String(formData.get('planCode') ?? '')
  const status = String(formData.get('subscriptionStatus') ?? '')
  const starts = String(formData.get('startsAt') ?? '').trim()
  const ends = String(formData.get('endsAt') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()
  if (!targetUser || !plan || !['pending', 'active', 'past_due', 'expired', 'cancelled'].includes(status)) redirect(back('error', 'Choose a plan and a status.', targetUser || undefined))
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_member_subscription', {
    target_user: targetUser, plan, new_status: status,
    starts: starts ? new Date(starts).toISOString() : null, ends: ends ? new Date(ends).toISOString() : null, note: note || null,
  })
  if (error) redirect(back('error', error.message, targetUser))
  revalidatePath(`/admin/users/${targetUser}`); revalidatePath('/admin/subscriptions'); revalidatePath('/dashboard/billing')
  redirect(back('message', `Subscription set to ${status} on ${plan.replaceAll('_', ' ')}.`, targetUser))
}
