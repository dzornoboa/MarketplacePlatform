import type { EmailOtpType } from '@supabase/supabase-js'

/* Where a user should land once a link has been verified. */
export function destinationForOtpType(type: EmailOtpType | string | null): string {
  switch (type) {
    case 'recovery': return '/reset-password'
    case 'invite': return '/set-password'
    case 'email_change': return '/dashboard/settings'
    default: return '/dashboard'
  }
}

/* Supabase error codes are not written for members. Turn them into something
   actionable, and send the user to the page that lets them fix it — an expired
   reset link should land on "request a new one", not a dead end. */
export function friendlyAuthError(
  code: string | null,
  description: string | null,
  type: EmailOtpType | string | null,
): { message: string; path: string } {
  const recovery = type === 'recovery'
  const invite = type === 'invite'

  /* A PKCE link can only be completed in the browser that asked for it: the
     code verifier lives in that browser. Opening the email on a phone, or an
     invitation that was sent from the Supabase dashboard, lands here — and
     "expired" would be the wrong thing to tell the member. */
  const noVerifier = code === 'exchange_failed' && /verifier|code challenge|invalid request/i.test(description ?? '')
  if (noVerifier) {
    if (recovery) {
      return {
        message: 'Open the reset link in the same browser where you asked for it — or request a fresh link below and open it straight from that device.',
        path: '/forgot-password',
      }
    }
    return {
      message: 'That link has to be opened in the browser it was requested from. Request a new one, or sign in if your account is already active.',
      path: '/login',
    }
  }

  switch (code) {
    case 'otp_expired':
    case 'exchange_failed':
    case 'missing_token':
      if (recovery) {
        return {
          message: 'That password reset link has expired or has already been used. Request a new one below — links are valid for a limited time and work only once.',
          path: '/forgot-password',
        }
      }
      if (invite) {
        return {
          message: 'That invitation link has expired or has already been used. Ask WTC Accra to send a new invitation.',
          path: '/login',
        }
      }
      return {
        message: 'That confirmation link has expired or has already been used. Sign in to request a new one.',
        path: '/login',
      }
    case 'access_denied':
      return {
        message: 'That link is no longer valid. Request a new one to continue.',
        path: recovery ? '/forgot-password' : '/login',
      }
    case 'email_not_confirmed':
      return { message: 'Confirm your email address before signing in. Check your inbox for the confirmation link.', path: '/login' }
    case 'user_banned':
      return { message: 'This account is not active. Contact WTC Accra support.', path: '/login' }
    default:
      return {
        message: description?.trim()
          ? `We could not complete that request: ${description.trim()}`
          : 'We could not complete that request. Please try again.',
        path: recovery ? '/forgot-password' : '/login',
      }
  }
}
