import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { passwordRecoveryGrant, recoveryCookie, recoveryLifetime } from '@/lib/auth/password-recovery'
import { clearRegistrationFollowup } from '@/lib/auth/registration-followups'
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
  const type = (params.get('type') ?? (next === '/reset-password' ? 'recovery' : null)) as EmailOtpType | null

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
  const finishRecovery = async (accessToken: string) => {
    const { data } = await supabase.auth.getClaims(accessToken)
    const grant = passwordRecoveryGrant(data?.claims?.session_id)
    if (!grant) {
      redirectTo.pathname = '/forgot-password'
      redirectTo.searchParams.set('error', 'The password link could not be verified. Request a fresh link.')
      return NextResponse.redirect(redirectTo)
    }
    const response = NextResponse.redirect(new URL('/reset-password', request.nextUrl.origin))
    response.cookies.set(recoveryCookie, grant, {
      httpOnly: true, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:',
      path: '/', maxAge: recoveryLifetime,
    })
    return response
  }

  const code = params.get('code')
  const tokenHash = params.get('token_hash')

  if (code) {
    const flowId = params.get('sb_flow_id')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined)
    if (!error) {
      if ('redirectType' in data && data.redirectType === 'recovery') return await finishRecovery(data.session.access_token)
      if (data.user?.email && data.user.email_confirmed_at) await clearRegistrationFollowup(data.user.email)
      return NextResponse.redirect(new URL(next || destinationForOtpType(type), request.nextUrl.origin))
    }
    const { message, path } = friendlyAuthError('exchange_failed', error.message, type)
    redirectTo.pathname = path
    redirectTo.searchParams.set('error', message)
    return NextResponse.redirect(redirectTo)
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      if (type === 'recovery' && data.session) return await finishRecovery(data.session.access_token)
      if (data.user?.email && data.user.email_confirmed_at) await clearRegistrationFollowup(data.user.email)
      return NextResponse.redirect(new URL(next || destinationForOtpType(type), request.nextUrl.origin))
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
