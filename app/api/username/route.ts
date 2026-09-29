import { NextRequest, NextResponse } from 'next/server'
import { allow } from '@/lib/security/throttle'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  if (!(await allow('username_check', 60, 600))) return NextResponse.json({ available: false, valid: false, error: 'Too many requests.' }, { status: 429 })
  const candidate = (request.nextUrl.searchParams.get('username') ?? '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(candidate)) {
    return NextResponse.json({ available: false, valid: false })
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ available: false, valid: true }, { status: 503 })
  const { url } = getSupabasePublicConfig()
  const supabase = createSupabaseClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.rpc('username_available', { candidate })
  if (error) return NextResponse.json({ available: false, valid: true }, { status: 503 })
  return NextResponse.json({ available: Boolean(data), valid: true })
}
