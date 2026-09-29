import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifyEmailCode, resendVerificationCode, resumeRegistration } from '../actions'
import { LogoLink } from '@/components/brand'
import { SubmitButton } from '@/components/submit-button'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/* Step two of registration: the code from the confirmation email. */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const email = typeof params.email === 'string' ? params.email : ''
  if (!email) redirect('/register')
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  return (
    <main className="center-page">
      <section className="card auth-card">
        <LogoLink />
        <p className="eyebrow">Verify Your Email</p>
        <h1>Enter The Code We Sent</h1>
        <p className="muted">Enter the 6-digit code sent to <strong>{email}</strong>. You can also use the secure confirmation link in the email.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form action={verifyEmailCode} className="form-stack">
          <input type="hidden" name="email" value={email} />
          <label>Verification Code<input className="verify-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" required autoFocus /></label>
          <SubmitButton pendingLabel="Verifying…">Verify And Continue</SubmitButton>
        </form>
        <form action={resendVerificationCode} className="field-help">
          <input type="hidden" name="email" value={email} />
          Didn&apos;t get it? Check your spam folder or <button className="link-button" type="submit">send a new code</button>.
        </form>
        <div className="verification-existing-account">
          <p className="field-help">Already confirmed this email, or stopped during setup?</p>
          <form action={resumeRegistration}>
            <input type="hidden" name="email" value={email} />
            <SubmitButton className="button button-outline" pendingLabel="Preparing…">Continue Existing Account</SubmitButton>
          </form>
        </div>
        <Link className="arrow-link" href="/login">← Back To Sign In</Link>
      </section>
    </main>
  )
}
