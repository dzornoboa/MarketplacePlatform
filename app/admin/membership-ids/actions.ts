'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(kind: 'message' | 'error', text: string) {
  return `/admin/membership-ids?${kind}=${encodeURIComponent(text)}`
}

export async function generateMembershipId(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const note = String(formData.get('note') ?? '').trim()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('generate_wtc_accra_membership_id', {
    assigned_email: email || null,
    note: note || null,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/membership-ids')
  redirect(back('message', email ? `Membership ID ${data} generated, assigned and queued for email delivery.` : `Membership ID ${data} generated and available for assignment.`))
}

export async function assignMembershipId(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim().toUpperCase()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const supabase = await createClient()
  const { error } = await supabase.rpc('assign_wtc_accra_membership_id', {
    membership_code: code,
    member_email: email,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/membership-ids')
  redirect(back('message', `${code} assigned to ${email} and queued for email delivery.`))
}

export async function revokeMembershipId(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim().toUpperCase()
  const reason = String(formData.get('reason') ?? '').trim()
  const supabase = await createClient()
  const { error } = await supabase.rpc('revoke_wtc_accra_membership_id', {
    membership_code: code,
    reason: reason || null,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/membership-ids')
  redirect(back('message', `${code} revoked.`))
}
