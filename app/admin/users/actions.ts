'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string) {
  return `/admin/users?${key}=${encodeURIComponent(message)}`
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
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/users')
  redirect(back('message', 'Marketplace access updated. The member is notified immediately.'))
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
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/users')
  redirect(back('message', `Account status set to ${newStatus}.`))
}

export async function updateStaffRole(formData: FormData) {
  const targetUser = String(formData.get('userId') ?? '')
  const newRole = String(formData.get('systemRole') ?? '')
  if (!targetUser || !newRole) redirect(back('error', 'Invalid role change.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_staff_role', { target_user: targetUser, new_role: newRole })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/users')
  redirect(back('message', `Role updated to ${newRole.replaceAll('_', ' ')}.`))
}
