'use server'

import { safeNextPath } from '@/lib/auth/redirects'

import { moderationError } from '@/lib/ai/content-moderation'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DOCUMENT_PURPOSES } from '@/lib/kyc'

import { DOCUMENT_BUCKET as BUCKET, DOCUMENT_LIMIT, documentObjectPath, documentUploadError } from '@/lib/document-uploads'

const SCOPES = new Set(['private', 'verified', 'granted'])

function back(key: 'error' | 'message', message: string) {
  return `/dashboard/documents?${key}=${encodeURIComponent(message)}`
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
  if (!(file instanceof File)) redirect(back('error', 'Choose a file to upload.'))
  const fileError = documentUploadError(file)
  if (fileError) redirect(back('error', fileError))

  const { count, error: countError } = await supabase.from('document_records')
    .select('id', { count: 'exact', head: true }).eq('owner_user_id', userId)
  if (countError || count === null) redirect(back('error', 'Unable to check your document limit. Try again.'))
  if (count >= DOCUMENT_LIMIT) redirect(back('error', 'Delete an old document or request an extra upload.'))

  const scope = String(formData.get('accessScope') ?? 'private')
  if (!SCOPES.has(scope)) redirect(back('error', 'Choose who may see this document.'))
  const opportunityId = String(formData.get('opportunityId') ?? '').trim() || null
  const dealRoomId = String(formData.get('dealRoomId') ?? '').trim() || null
  const purpose = String(formData.get('purpose') ?? 'general')
  const returnTo = safeNextPath(String(formData.get('returnTo') ?? ''), '/dashboard/documents')
  if (!(DOCUMENT_PURPOSES as readonly string[]).includes(purpose)) redirect(back('error', 'Choose what this document is.'))

  const shared = Boolean(dealRoomId) || (scope !== 'private' && Boolean(opportunityId))
  if (shared && file.type.startsWith('image/')) {
    const screening = await moderationError('shared document image', '', { image: file })
    if (screening) redirect(back('error', screening))
  }

  const objectPath = documentObjectPath(userId, file.name)
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
    // The member cannot read an object without a record, so privileged cleanup is limited to the path just created above.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) await createAdminClient().storage.from(BUCKET).remove([objectPath])
    else await supabase.storage.from(BUCKET).remove([objectPath])
    redirect(back('error', recordError.message))
  }

  revalidatePath('/dashboard/documents')
  revalidatePath('/dashboard/verification')
  redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}message=${encodeURIComponent('Document uploaded.')}`)
}

export async function deleteDocument(formData: FormData) {
  const documentId = String(formData.get('documentId') ?? '')
  if (!documentId) redirect(back('error', 'Document not found.'))
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()
  const ownerId = claims?.claims?.sub
  if (!ownerId) redirect('/login')
  const { data: record } = await supabase.from('document_records')
    .select('object_path').eq('id', documentId).eq('owner_user_id', ownerId).maybeSingle()
  if (!record) redirect(back('error', 'Document not found.'))

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([record.object_path])
  if (storageError) redirect(back('error', 'Unable to delete the file. Try again.'))
  const { error } = await supabase.from('document_records').delete().eq('id', documentId).eq('owner_user_id', ownerId)
  if (error) redirect(back('error', error.message))

  revalidatePath('/dashboard/documents')
  redirect(back('message', 'Document deleted.'))
}

/* Re-classify a document (e.g. mark an upload as the identity document so
   the verification checklist recognises it). RLS limits this to the owner. */
export async function setDocumentPurpose(formData: FormData) {
  const id = String(formData.get('documentId') ?? '')
  const purpose = String(formData.get('purpose') ?? '')
  if (!id || !(DOCUMENT_PURPOSES as readonly string[]).includes(purpose)) redirect(back('error', 'Choose what this document is.'))
  const supabase = await createClient()
  const { error } = await supabase.from('document_records').update({ purpose }).eq('id', id)
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/documents'); revalidatePath('/dashboard/verification')
  redirect(back('message', 'Document type updated.'))
}
