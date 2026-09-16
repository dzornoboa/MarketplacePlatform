import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'

const BUCKET = 'platform-documents'

/* Resolves a document to a short-lived signed URL and redirects to it.
   A GET route (rather than a server-action redirect) works in every browser,
   can be opened in a new tab, and still runs entirely under the caller's RLS:
   if document_records does not return the row, there is nothing to sign. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) return NextResponse.redirect(new URL('/login', _request.url))
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('Not found', { status: 404 })
  if (!(await allow('document_open', 120, 600))) return new NextResponse('Too many document requests. Try again shortly.', { status: 429 })

  const { data: record } = await supabase.from('document_records')
    .select('id,object_path,file_name').eq('id', id).maybeSingle()
  if (!record) return new NextResponse('Not found or not permitted', { status: 404 })

  const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUrl(record.object_path, 120)
  if (error || !signed) return new NextResponse('Unable to sign document', { status: 500 })

  // Best-effort access record; the document still opens if this fails.
  await supabase.from('document_access_events').insert({
    document_id: record.id, user_id: String(claimsData.claims.sub), event_type: 'signed_url',
  })

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}
