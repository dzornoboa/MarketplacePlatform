'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'platform-documents'
const MAX_BYTES = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])
const SCOPES = new Set(['private', 'verified', 'granted'])

function back(key: 'error' | 'message', message: string) {
  return `/dashboard/documents?${key}=${encodeURIComponent(message)}`
}

function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-120)
}

/* Storage RLS requires the object to live under <user id>/, and the SELECT
   policy only matches objects that already have a document_records row — so
   the record is written immediately after upload, and the object is removed
   again if that insert fails. */
export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) redirect(back('error', 'Choose a file to upload.'))
  if (file.size > MAX_BYTES) redirect(back('error', 'Files must be 25MB or smaller.'))
  if (!ALLOWED_TYPES.has(file.type)) redirect(back('error', 'Allowed types are PDF, PNG, JPEG, DOCX and XLSX.'))

  const scope = String(formData.get('accessScope') ?? 'private')
  if (!SCOPES.has(scope)) redirect(back('error', 'Choose who may see this document.'))
  const opportunityId = String(formData.get('opportunityId') ?? '').trim() || null
  const dealRoomId = String(formData.get('dealRoomId') ?? '').trim() || null
  const purpose = String(formData.get('purpose') ?? 'general')
  const returnTo = String(formData.get('returnTo') ?? '/dashboard/documents')
  if (!['general','business_certificate','identity','profile','financials','other'].includes(purpose)) redirect(back('error', 'Choose what this document is.'))

  const objectPath = `${userId}/${crypto.randomUUID()}-${safeName(file.name)}`
  const { error: uploadError } = await supabase.storage.from(BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: false })
  if (uploadError) redirect(back('error', `Upload failed: ${uploadError.message}`))

  const { error: recordError } = await supabase.from('document_records').insert({
    owner_user_id: String(userId),
    opportunity_id: opportunityId,
    deal_room_id: dealRoomId,
    object_path: objectPath,
    file_name: file.name.slice(-160),
    mime_type: file.type,
    size_bytes: file.size,
    access_scope: scope as 'private',
    purpose,
  })
  if (recordError) {
    await supabase.storage.from(BUCKET).remove([objectPath])
    redirect(back('error', recordError.message))
  }

  revalidatePath('/dashboard/documents')
  revalidatePath('/dashboard/verification')
  redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}message=${encodeURIComponent('Document uploaded.')}`)
}

/* Signed URLs are short-lived and generated per request, so a link cannot be
   forwarded and reused indefinitely. */
export async function openDocument(formData: FormData) {
  const documentId = String(formData.get('documentId') ?? '')
  if (!documentId) redirect(back('error', 'Document not found.'))
  const supabase = await createClient()

  const { data: record, error } = await supabase.from('document_records')
    .select('object_path').eq('id', documentId).maybeSingle()
  if (error || !record) redirect(back('error', 'You do not have access to that document.'))

  const { data: signed, error: signError } = await supabase.storage.from(BUCKET)
    .createSignedUrl(record.object_path, 120)
  if (signError || !signed) redirect(back('error', 'Unable to open the document.'))

  redirect(signed.signedUrl)
}

export async function deleteDocument(formData: FormData) {
  const documentId = String(formData.get('documentId') ?? '')
  if (!documentId) redirect(back('error', 'Document not found.'))
  const supabase = await createClient()

  const { data: record } = await supabase.from('document_records')
    .select('object_path').eq('id', documentId).maybeSingle()
  const { error } = await supabase.from('document_records').delete().eq('id', documentId)
  if (error) redirect(back('error', error.message))
  if (record) await supabase.storage.from(BUCKET).remove([record.object_path])

  revalidatePath('/dashboard/documents')
  redirect(back('message', 'Document deleted.'))
}
