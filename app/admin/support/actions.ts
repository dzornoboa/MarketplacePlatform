'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminProfile, requireCapability } from '@/lib/auth/guards'
import { DOCUMENT_BUCKET, EXTRA_DOCUMENT_CATEGORY, documentObjectPath, documentUploadError } from '@/lib/document-uploads'
import { DOCUMENT_PURPOSES } from '@/lib/kyc'

const STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed'])

function back(key: 'error' | 'message', message: string) {
  return `/admin/support?${key}=${encodeURIComponent(message)}`
}

export async function replyAsStaff(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '')
  const body = String(formData.get('body') ?? '').trim()
  const status = String(formData.get('status') ?? '')
  if (!requestId) redirect(back('error', 'Request not found.'))
  if (body.length < 1 || body.length > 5000) redirect(back('error', 'Write a reply of up to 5000 characters.'))

  const { supabase, profile } = await requireCapability('support')

  const { error } = await supabase.from('support_messages')
    .insert({ support_request_id: requestId, author_id: profile.id, body })
  if (error) redirect(back('error', error.message))

  if (status && STATUSES.has(status)) {
    const { error: statusError } = await supabase.from('support_requests')
      .update({ status: status as 'open' }).eq('id', requestId)
    if (statusError) redirect(back('error', statusError.message))
  }

  revalidatePath('/admin/support')
  revalidatePath('/dashboard/support')
  redirect(back('message', 'Reply sent to the member.'))
}

export async function assignToMe(formData: FormData) {
  const requestId = String(formData.get('requestId') ?? '')
  if (!requestId) redirect(back('error', 'Request not found.'))
  const { supabase, profile } = await requireCapability('support')

  const { error } = await supabase.from('support_requests')
    .update({ assigned_to: profile.id, status: 'in_progress' }).eq('id', requestId)
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/support')
  redirect(back('message', 'Request assigned to you.'))
}

export async function fulfillExtraUpload(formData: FormData) {
  const { supabase } = await requireAdminProfile()
  const requestId = String(formData.get('requestId') ?? '')
  const file = formData.get('file')
  const purpose = String(formData.get('purpose') ?? 'general')
  if (!(file instanceof File)) redirect(back('error', 'Choose a file to upload.'))
  const fileError = documentUploadError(file)
  if (fileError) redirect(back('error', fileError))
  if (!(DOCUMENT_PURPOSES as readonly string[]).includes(purpose)) redirect(back('error', 'Choose the document type.'))

  const { data: request, error: requestError } = await supabase.from('support_requests')
    .select('id,user_id').eq('id', requestId).eq('category', EXTRA_DOCUMENT_CATEGORY)
    .in('status', ['open', 'in_progress']).maybeSingle()
  if (requestError || !request) redirect(back('error', 'This extra upload request is no longer open.'))

  const admin = createAdminClient()
  const objectPath = documentObjectPath(request.user_id, file.name)
  const bucket = admin.storage.from(DOCUMENT_BUCKET)
  const { error: uploadError } = await bucket.upload(objectPath, file, { contentType: file.type, upsert: false })
  if (uploadError) redirect(back('error', 'Unable to upload the file. Try again.'))

  const { error: recordError } = await admin.from('document_records').insert({
    owner_user_id: request.user_id,
    extra_upload_request_id: request.id,
    object_path: objectPath,
    file_name: file.name.slice(-160),
    size_bytes: file.size,
    mime_type: file.type,
    access_scope: 'private',
    purpose,
  })
  if (recordError) {
    await bucket.remove([objectPath])
    redirect(back('error', recordError.message))
  }

  revalidatePath('/admin/support')
  revalidatePath('/dashboard/support')
  revalidatePath('/dashboard/documents')
  revalidatePath('/dashboard/verification')
  redirect(back('message', 'Document saved to the member’s private files and the request resolved.'))
}
