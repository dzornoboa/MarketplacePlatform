'use server'

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

  const dealRoomId = String(formData.get('dealRoomId') ?? '').trim() || null
  const verificationUpload = formData.get('returnTo') === '/dashboard/verification'
  const validRoomId = dealRoomId && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(dealRoomId)
  const returnTo = validRoomId ? `/dashboard/deal-rooms/${dealRoomId}`
    : verificationUpload ? '/dashboard/verification' : '/dashboard/documents'
  const fail = (message: string): never => redirect(`${returnTo}?error=${encodeURIComponent(message)}`)

  if (dealRoomId && !validRoomId) fail('Deal room not found.')
  const file = formData.get('file')
  if (!(file instanceof File)) return fail('Choose a file to upload.')
  const fileError = documentUploadError(file)
  if (fileError) fail(fileError)

  if (dealRoomId) {
    const { data: room, error } = await supabase.from('deal_rooms').select('status').eq('id', dealRoomId).maybeSingle()
    if (error) fail('Could not check the deal room. Try again.')
    if (!room) fail('You do not have access to this deal room.')
    if (room?.status !== 'active') fail('This deal room is closed to new documents.')
  }

  const { count, error: countError } = await supabase.from('document_records')
    .select('id', { count: 'exact', head: true }).eq('owner_user_id', userId)
  if (countError || count === null) return fail('Unable to check your document limit. Try again.')
  if (count >= DOCUMENT_LIMIT) fail('Delete an old document or request an extra upload.')

  const scope = String(formData.get('accessScope') ?? 'private')
  if (!SCOPES.has(scope)) fail('Choose who may see this document.')
  const opportunityId = String(formData.get('opportunityId') ?? '').trim() || null
  const purpose = String(formData.get('purpose') ?? 'general')
  if (!(DOCUMENT_PURPOSES as readonly string[]).includes(purpose)) fail('Choose what this document is.')

  const shared = Boolean(dealRoomId) || (scope !== 'private' && Boolean(opportunityId))
  if (shared && file.type.startsWith('image/')) {
    const screening = await moderationError('shared document image', '', { image: file })
    if (screening) fail(screening)
  }

  const objectPath = documentObjectPath(userId, file.name)
  const { error: uploadError } = await supabase.storage.from(BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: false })
  if (uploadError) {
    console.error('Document storage upload failed', uploadError.name)
    fail('Could not upload the file. Try again.')
  }

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
    console.error('Document record write failed', recordError.code)
    if (recordError.code === 'P0001' && recordError.message.startsWith('You can keep up to five')) {
      fail('Delete an old document or request an extra upload.')
    }
    fail('Could not attach the file. Check your access and try again.')
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
