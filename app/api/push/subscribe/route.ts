import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'

/* Saves (or removes) this browser's push subscription for the signed-in
   member. RLS on push_subscriptions restricts every row to its own user_id,
   so there is nothing more to check here. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  if (!(await allow('push_subscribe', 20, 3600))) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const auth = body?.keys?.auth
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 })

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: String(userId), endpoint, p256dh, auth,
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  }, { onConflict: 'endpoint' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => null) as { endpoint?: string } | null
  if (!body?.endpoint) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
