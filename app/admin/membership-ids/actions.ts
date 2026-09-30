'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/supabase/config'
import { parseMembershipImport } from '@/lib/membership/import'

function back(kind: 'message' | 'error', text: string, batchId?: string) {
  const params = new URLSearchParams({ [kind]: text })
  if (batchId) params.set('batch', batchId)
  return `/admin/membership-ids?${params.toString()}`
}

const MEMBER_TYPES = new Set(['wtc_accra','wtca'])

async function requireMembershipIdCapability() {
  const supabase = await createClient()
  const { data: caps, error } = await supabase.rpc('my_staff_capabilities')
  if (error || !(caps ?? []).includes('membership_ids')) throw new Error('Membership ID management access required.')
  return { supabase, capabilities: new Set(caps ?? []) }
}

export async function generateMembershipId(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const note = String(formData.get('note') ?? '').trim()
  const memberType = String(formData.get('memberType') ?? 'wtc_accra')
  if (!MEMBER_TYPES.has(memberType)) redirect(back('error', 'Choose a valid membership type.'))
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('generate_membership_access_id', {
    member_type: memberType,
    assigned_email: email || null,
    note: note || null,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/membership-ids')
  const label = memberType === 'wtca' ? 'WTCA Member ID' : 'WTC Accra Membership ID'
  redirect(back('message', email ? `${label} ${data} generated, activated for ${email} and queued for email delivery.` : `${label} ${data} generated and available for assignment.`))
}

export async function assignMembershipId(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim().toUpperCase()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const supabase = await createClient()
  const { error } = await supabase.rpc('assign_membership_access_id', {
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
  const { error } = await supabase.rpc('revoke_membership_access_id', {
    membership_code: code,
    reason: reason || null,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/membership-ids')
  redirect(back('message', `${code} revoked.`))
}


export async function importMembershipRoster(formData: FormData) {
  const file = formData.get('file')
  const memberType = String(formData.get('memberType') ?? '')
  if (!(file instanceof File)) redirect(back('error', 'Choose an Excel .xlsx or CSV file.'))
  if (!MEMBER_TYPES.has(memberType)) redirect(back('error', 'Choose WTC Accra Member or WTCA Member for this upload.'))

  let rows
  try {
    rows = await parseMembershipImport(file)
  } catch (error) {
    redirect(back('error', error instanceof Error ? error.message : 'Could not read the import file.'))
  }
  if (!rows.length) redirect(back('error', 'The file contains no member rows.'))

  const { supabase } = await requireMembershipIdCapability().catch(error => {
    redirect(back('error', error instanceof Error ? error.message : 'Access denied.'))
  })
  const { data: batchId, error } = await supabase.rpc('stage_membership_import', {
    member_type: memberType,
    source_file_name: file.name,
    rows_json: rows,
  })
  if (error || !batchId) redirect(back('error', error?.message ?? 'Could not stage the membership import.'))

  revalidatePath('/admin/membership-ids')
  redirect(back('message', `${rows.length} member row${rows.length === 1 ? '' : 's'} imported for review. Membership IDs were prepared but are not active until you activate the selected rows.`, String(batchId)))
}

type ActivationPayload = {
  state?: string
  row_id?: string
  user_id?: string
  code?: string
  email?: string
  participant_type?: string
  full_name?: string
  organisation_name?: string | null
  phone?: string | null
  country?: string | null
  country_code?: string | null
  city?: string | null
  job_title?: string | null
  wtca_chapter?: string | null
  date_of_birth?: string | null
  id_type?: string | null
  id_number?: string | null
  preferred_currency?: string | null
}

async function activateOne(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rowId: string,
  markVerified: boolean,
  canVerify: boolean,
) {
  const { data, error } = await supabase.rpc('activate_membership_import_row', { import_row_id: rowId })
  if (error) throw new Error(error.message)
  const payload = (data ?? {}) as ActivationPayload

  if (payload.state === 'linked_existing' || payload.state === 'already_activated') {
    if (markVerified && canVerify && payload.user_id) {
      const { error: verifyError } = await supabase.rpc('set_verification_status', {
        target_user: payload.user_id,
        new_status: 'verified',
        note: 'Verified during approved membership roster activation.',
      })
      if (verifyError) throw new Error(verifyError.message)
    }
    return payload
  }

  if (payload.state !== 'invite_required' || !payload.email || !payload.code || !payload.participant_type) {
    throw new Error('The membership row could not be prepared for activation.')
  }

  const admin = createAdminClient()
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(payload.email, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/set-password`,
    data: {
      full_name: payload.full_name ?? '',
      participant_type: payload.participant_type,
      organisation_name: payload.organisation_name ?? null,
      phone: payload.phone ?? null,
      country: payload.country ?? null,
      country_code: payload.country_code ?? null,
      city: payload.city ?? null,
      job_title: payload.job_title ?? null,
      wtca_chapter: payload.wtca_chapter ?? null,
      date_of_birth: payload.date_of_birth ?? null,
      id_type: payload.id_type ?? null,
      id_number: payload.id_number ?? null,
      preferred_currency: payload.preferred_currency ?? 'USD',
      membership_access_id: payload.code,
      admin_provisioned: true,
    },
  })

  if (inviteError || !invitation.user?.id) {
    // An account may have appeared between preparation and invitation. Re-run
    // the database step once so it can safely link the prepared ID to it.
    if (/already|registered|exists/i.test(inviteError?.message ?? '')) {
      const retry = await supabase.rpc('activate_membership_import_row', { import_row_id: rowId })
      const retryPayload = (retry.data ?? {}) as ActivationPayload
      if (!retry.error && (retryPayload.state === 'linked_existing' || retryPayload.state === 'already_activated')) return retryPayload
    }
    await supabase.rpc('mark_membership_import_error', {
      import_row_id: rowId,
      error_text: inviteError?.message ?? 'Invitation could not be created.',
    })
    throw new Error(inviteError?.message ?? 'Invitation could not be created.')
  }

  const userId = invitation.user.id
  const { error: completeError } = await supabase.rpc('complete_membership_import_activation', {
    import_row_id: rowId,
    target_user: userId,
  })
  if (completeError) throw new Error(completeError.message)

  if (markVerified && canVerify) {
    const { error: verifyError } = await supabase.rpc('set_verification_status', {
      target_user: userId,
      new_status: 'verified',
      note: 'Verified during approved membership roster activation.',
    })
    if (verifyError) throw new Error(verifyError.message)
  }

  return { ...payload, state: 'activated', user_id: userId }
}

export async function activateImportedMembers(formData: FormData) {
  const batchId = String(formData.get('batchId') ?? '')
  const mode = String(formData.get('mode') ?? 'selected')
  const markVerified = String(formData.get('markVerified') ?? '') === 'on'
  if (!batchId) redirect(back('error', 'Import batch not found.'))

  const auth = await requireMembershipIdCapability().catch(error => {
    redirect(back('error', error instanceof Error ? error.message : 'Access denied.', batchId))
  })
  const { supabase, capabilities } = auth
  if (markVerified && !capabilities.has('verification')) {
    redirect(back('error', 'Verification capability is required to mark imported members verified.', batchId))
  }

  let rowIds = formData.getAll('rowId').map(String).filter(Boolean)
  if (mode === 'all') {
    const { data, error } = await supabase.from('membership_import_rows')
      .select('id').eq('batch_id', batchId).in('status', ['prepared','error','inviting'])
    if (error) redirect(back('error', error.message, batchId))
    rowIds = (data ?? []).map(row => row.id)
  }
  rowIds = [...new Set(rowIds)]
  if (!rowIds.length) redirect(back('error', 'Select at least one ready member row to activate.', batchId))

  let activated = 0
  const failures: string[] = []
  for (const rowId of rowIds.slice(0, 250)) {
    try {
      await activateOne(supabase, rowId, markVerified, capabilities.has('verification'))
      activated++
    } catch (error) {
      failures.push(error instanceof Error ? error.message : 'Activation failed')
    }
  }

  revalidatePath('/admin/membership-ids')
  revalidatePath('/admin/users')
  const suffix = failures.length ? ` ${failures.length} row${failures.length === 1 ? '' : 's'} need attention: ${failures.slice(0, 3).join(' | ')}` : ''
  redirect(back('message', `${activated} member account${activated === 1 ? '' : 's'} activated and invitation/notification delivery queued.${suffix}`, batchId))
}
