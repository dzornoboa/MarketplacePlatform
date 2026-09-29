import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const authorizationId = String(form.get('authorization_id') ?? '')
  const decision = String(form.get('decision') ?? '')

  if (!authorizationId || !['approve', 'deny'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid OAuth decision request.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`, request.url), 303)

  const result = decision === 'approve'
    ? await supabase.auth.oauth.approveAuthorization(authorizationId)
    : await supabase.auth.oauth.denyAuthorization(authorizationId)

  if (result.error || !result.data?.redirect_url) {
    return NextResponse.json({ error: result.error?.message ?? 'Unable to complete OAuth authorization.' }, { status: 400 })
  }

  return NextResponse.redirect(result.data.redirect_url, 303)
}
