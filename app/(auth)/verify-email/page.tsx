import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifyEmailCode, resendVerificationCode, resumeRegistration } from '../actions'
import { LogoLink } from '@/components/brand'
import { SubmitButton } from '@/components/submit-button'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/* Step two of registration: the code from the confirmation email. */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const email = typeof params.email === 'string' ? params.email : ''
  if (!email) redirect('/register')
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const supabase = await createClient()
  const { data: resumeState } = await supabase.rpc('registration_resume_state', { lookup_email: email })
  const state = resumeState as { exists?: boolean; confirmed?: boolean; profile_completed?: boolean } | null
  const alreadyConfirmed = !!state?.confirmed

  return (
    <main className="center-page">
      <section className="card auth-card">
        <LogoLink />
        <p className="eyebrow">{alreadyConfirmed ? 'Continue Your Account' : 'Verify Your Email'}</p>
        <h1>{alreadyConfirmed ? 'Continue Account Setup' : 'Enter The Code We Sent'}</h1>
        {alreadyConfirmed
          ? <p className="muted"><strong>{email}</strong> is already verified. You do not need another verification code. Continue with your existing account and your saved information will be kept.</p>
          : <p className="muted">A verification email has been sent to <strong>{email}</strong>. Enter the 6-digit code shown in the email. If your email contains a secure confirmation link instead, you can use that link to continue.</p>}
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {alreadyConfirmed ? <>
          <form action={resumeRegistration} className="form-stack">
            <input type="hidden" name="email" value={email} />
            <SubmitButton pendingLabel="Preparing…">Continue Account Setup</SubmitButton>
          </form>
          <p className="field-help">We will send a secure password link so you can create or reset your password, then sign in and continue with the profile information already saved.</p>
          <div className="button-row"><Link className="button button-outline" href={`/login?email=${encodeURIComponent(email)}&next=/dashboard/profile`}>I Know My Password</Link><Link className="button button-outline" href={`/forgot-password?email=${encodeURIComponent(email)}`}>Reset Password</Link></div>
        </> : <>
          <form action={verifyEmailCode} className="form-stack">
            <input type="hidden" name="email" value={email} />
            <label>Verification Code<input className="verify-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" required autoFocus /></label>
            <SubmitButton pendingLabel="Verifying…">Verify And Continue</SubmitButton>
          </form>
          <form action={resendVerificationCode} className="field-help">
            <input type="hidden" name="email" value={email} />
            Didn&apos;t get it? Check your spam folder or <button className="link-button" type="submit">send a new code</button>. The secure confirmation link in the email works too.
          </form>
        </>}
        <Link className="arrow-link" href="/login">← Back To Sign In</Link>
      </section>
    </main>
  )
}
