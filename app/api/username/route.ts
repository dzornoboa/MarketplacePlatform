import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const candidate = (request.nextUrl.searchParams.get('username') ?? '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(candidate)) {
    return NextResponse.json({ available: false, valid: false })
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('username_available', { candidate })
  if (error) return NextResponse.json({ available: false, valid: true }, { status: 503 })
  return NextResponse.json({ available: Boolean(data), valid: true })
}
