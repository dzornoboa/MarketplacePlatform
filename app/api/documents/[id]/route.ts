import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'

const BUCKET = 'platform-documents'

/* Authorize with the caller's RLS and stream the private object from the Hub. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) return NextResponse.redirect(new URL('/login', _request.url))
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('Not found', { status: 404 })
  if (!(await allow('document_open', 120, 600))) return new NextResponse('Too many document requests. Try again shortly.', { status: 429 })

  const { data: record } = await supabase.from('document_records')
    .select('id,object_path,file_name,mime_type').eq('id', id).maybeSingle()
  if (!record) return new NextResponse('Not found or not permitted', { status: 404 })

  const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUrl(record.object_path, 120)
  if (error || !signed) return new NextResponse('Unable to sign document', { status: 500 })

  const range = _request.headers.get('range')
  let upstream: Response
  try {
    upstream = await fetch(signed.signedUrl, {
      cache: 'no-store',
      redirect: 'error',
      headers: range ? { Range: range } : {},
      signal: AbortSignal.timeout(25_000),
    })
  } catch {
    return new NextResponse('Unable to load document', { status: 502 })
  }
  if (!upstream.ok && upstream.status !== 416) {
    await upstream.body?.cancel()
    return new NextResponse('Unable to load document', { status: 502 })
  }

  if (upstream.ok && !range) {
    // Keep the existing audit event for compatibility with past reports.
    await supabase.from('document_access_events').insert({
      document_id: record.id, user_id: String(claimsData.claims.sub), event_type: 'signed_url',
    })
  }

  const type = upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  const previewable = type === record.mime_type && ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(type)
  const filename = encodeURIComponent(record.file_name.toWellFormed()).replace(/[!'()*]/g, char => '%' + char.charCodeAt(0).toString(16))
  const headers = new Headers({
    'cache-control': 'private, no-store',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'content-type': previewable ? type : 'application/octet-stream',
    'content-disposition': `${previewable ? 'inline' : 'attachment'}; filename*=UTF-8''${filename}`,
  })
  for (const name of ['accept-ranges', 'content-range']) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  if (upstream.status === 416) {
    await upstream.body?.cancel()
    return new NextResponse(null, { status: 416, headers })
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers })
}
