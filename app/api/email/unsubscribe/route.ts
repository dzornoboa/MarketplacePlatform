import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { validMarketingUnsubscribeSignature } from '@/lib/email/unsubscribe'
import { getSupabasePublicConfig, getSiteUrl } from '@/lib/supabase/config'
import type { Database } from '@/lib/database.types'

async function unsubscribe(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid') ?? ''
  const email = request.nextUrl.searchParams.get('email') ?? ''
  const sig = request.nextUrl.searchParams.get('sig') ?? ''
  if (!uid || !email || !validMarketingUnsubscribeSignature(uid, email, sig)) {
    return NextResponse.redirect(new URL('/unsubscribe?status=invalid', getSiteUrl()))
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.redirect(new URL('/unsubscribe?status=unavailable', getSiteUrl()))
  const { url } = getSupabasePublicConfig()
  const admin = createSupabaseClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: user } = await admin.auth.admin.getUserById(uid)
  if (!user.user || user.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.redirect(new URL('/unsubscribe?status=invalid', getSiteUrl()))
  }

  await admin.from('user_preferences').upsert({
    user_id: uid,
    marketing_emails: false,
  }, { onConflict: 'user_id' })

  return NextResponse.redirect(new URL('/unsubscribe?status=success', getSiteUrl()))
}

export async function GET(request: NextRequest) {
  return unsubscribe(request)
}

export async function POST(request: NextRequest) {
  return unsubscribe(request)
}
