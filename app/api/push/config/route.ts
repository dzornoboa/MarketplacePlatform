import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/* The VAPID public key is intentionally public. Serving it at runtime avoids
   Next.js build-time NEXT_PUBLIC_* substitution leaving an otherwise correctly
   configured deployment reporting "Push is not configured". The private VAPID
   key never leaves the server. */
export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
  const configured = !!(publicKey && process.env.VAPID_PRIVATE_KEY)
  return NextResponse.json(
    { configured, publicKey: configured ? publicKey : null },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
