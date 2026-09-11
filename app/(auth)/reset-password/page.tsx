import Link from 'next/link'
import { updatePassword } from '../actions'
import { LogoLink } from '@/components/brand'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null

  /* Reaching this page without a session means the recovery link was never
     verified — expired, already used, or opened in a different browser.
     Showing the form anyway would fail confusingly on submit. */
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const signedIn = !!claimsData?.claims?.sub

  return (
    <main className="center-page">
      <section className="card auth-card">
        <LogoLink />
        <p className="eyebrow">Choose a new password</p>
        <h1>Update password</h1>
        {error && <div className="alert alert-error">{error}</div>}

        {signedIn ? (
          <>
            <p className="muted">Pick a password you have not used on this account before.</p>
            <form action={updatePassword} className="form-stack">
              <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
              <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
              <p className="field-help">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
              <button className="button button-primary" type="submit">Update password</button>
            </form>
          </>
        ) : (
          <>
            <div className="alert alert-error">This password reset link is no longer valid. Reset links expire after a short time and can only be used once.</div>
            <p className="muted">Request a fresh link and open it in the same browser, using the most recent email if you requested more than one.</p>
            <div className="button-row">
              <Link className="button button-primary" href="/forgot-password">Request a new link</Link>
              <Link className="button button-outline" href="/login">Back to sign in</Link>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
