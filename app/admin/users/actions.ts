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

/* Support tools: temporary marketplace access, password reset, profile edits. */
export async function setSupportBypass(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const days = Number(formData.get('days') ?? 0)
  const reason = String(formData.get('reason') ?? '').trim()
  if (!targetUser) redirect(back('error', 'User not found.'))
  const until = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_support_bypass', { target_user: targetUser, until_at: until, reason: reason || null })
  if (error) redirect(back('error', error.message, targetUser))
  revalidatePath(`/admin/users/${targetUser}`)
  redirect(back('message', until ? `Marketplace opened for ${days} day${days === 1 ? '' : 's'} without a subscription.` : 'Support bypass removed.', targetUser))
}

export async function sendPasswordReset(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  if (!targetUser) redirect(back('error', 'User not found.'))
  const supabase = await createClient()
  const { data: email, error: lookupError } = await supabase.rpc('member_email', { target_user: targetUser })
  if (lookupError || !email) redirect(back('error', lookupError?.message ?? 'Could not find the member’s email.', targetUser))
  const { getSiteUrl } = await import('@/lib/supabase/config')
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getSiteUrl()}/auth/confirm?next=/reset-password` })
  if (error) redirect(back('error', `Reset email not sent: ${error.message}`, targetUser))
  await supabase.rpc('message_member', { target_user: targetUser, message_title: 'Password reset sent', message_body: 'WTC Accra support sent a password reset link to your email address. It expires in one hour.', message_href: '/dashboard/security' })
  revalidatePath(`/admin/users/${targetUser}`)
  redirect(back('message', `Password reset email sent to ${email}.`, targetUser))
}

export async function adminUpdateProfile(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  if (!targetUser) redirect(back('error', 'User not found.'))
  const fullName = String(formData.get('fullName') ?? '').trim()
  if (fullName.length < 2) redirect(back('error', 'Full name is required.', targetUser))
  const type = String(formData.get('participantType') ?? '')
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({
    full_name: fullName,
    phone: String(formData.get('phone') ?? '').trim() || null,
    job_title: String(formData.get('jobTitle') ?? '').trim() || null,
    country: String(formData.get('country') ?? '').trim() || null,
    city: String(formData.get('city') ?? '').trim() || null,
    wtca_membership_number: String(formData.get('wtcaNumber') ?? '').trim() || null,
    wtca_chapter: String(formData.get('wtcaChapter') ?? '').trim() || null,
    ...(type ? { participant_type: type as 'buyer', requested_participant_type: type as 'buyer' } : {}),
  }).eq('id', targetUser)
  if (error) redirect(back('error', error.message, targetUser))
  revalidatePath(`/admin/users/${targetUser}`); revalidatePath('/admin/users')
  redirect(back('message', 'Profile updated.', targetUser))
}
