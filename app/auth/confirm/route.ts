import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/redirects'

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null
  const next = safeNextPath(request.nextUrl.searchParams.get('next'))
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.search = ''

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(redirectTo)
  }

  redirectTo.pathname = '/login'
  redirectTo.searchParams.set('error', 'The confirmation link is invalid or has expired.')
  return NextResponse.redirect(redirectTo)
}
