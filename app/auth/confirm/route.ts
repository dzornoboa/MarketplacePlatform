import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/redirects'
import { friendlyAuthError, destinationForOtpType } from '@/lib/auth/errors'

/* Handles every way Supabase can hand a user back to the site:
   - `?code=`        PKCE exchange, which is what @supabase/ssr issues and what
                     the default `{{ .ConfirmationURL }}` email template produces.
   - `?token_hash=`  the token-hash flow, used when the email templates are
                     customised to point directly at this route.
   - `?error=`       Supabase refused the link (expired, already used, revoked).
   Previously only token_hash was handled, so password-reset links that came
   back as `?code=` fell through to a generic "link is invalid" message. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const next = safeNextPath(params.get('next'), '')
  const type = params.get('type') as EmailOtpType | null

  const redirectTo = request.nextUrl.clone()
  redirectTo.search = ''
  redirectTo.hash = ''

  const errorCode = params.get('error_code') ?? params.get('error')
  if (errorCode) {
    const { message, path } = friendlyAuthError(errorCode, params.get('error_description'), type)
    redirectTo.pathname = path
    redirectTo.searchParams.set('error', message)
    return NextResponse.redirect(redirectTo)
  }

  const supabase = await createClient()
  const code = params.get('code')
  const tokenHash = params.get('token_hash')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirectTo.pathname = next || destinationForOtpType(type)
      return NextResponse.redirect(redirectTo)
    }
    const { message, path } = friendlyAuthError('exchange_failed', error.message, type)
    redirectTo.pathname = path
    redirectTo.searchParams.set('error', message)
    return NextResponse.redirect(redirectTo)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      redirectTo.pathname = next || destinationForOtpType(type)
      return NextResponse.redirect(redirectTo)
    }
    const { message, path } = friendlyAuthError('otp_expired', error.message, type)
    redirectTo.pathname = path
    redirectTo.searchParams.set('error', message)
    return NextResponse.redirect(redirectTo)
  }

  const { message, path } = friendlyAuthError('missing_token', null, type)
  redirectTo.pathname = path
  redirectTo.searchParams.set('error', message)
  return NextResponse.redirect(redirectTo)
}
