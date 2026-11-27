import Link from 'next/link'
import { verifyEmailCode, resendVerificationCode, resumeRegistration } from '../actions'
import { LogoLink } from '@/components/brand'
import { SubmitButton } from '@/components/submit-button'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/* Step two of registration: the code from the confirmation email. */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const email = typeof params.email === 'string' ? params.email : ''
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  return (
    <main className="center-page">
      <section className="card auth-card">
        <LogoLink />
        <p className="eyebrow">Verify Your Email</p>
        <h1>Confirm Your Email Address</h1>
        <p className="muted">Open the confirmation link in the same browser where you registered. If your email includes a six-digit code, you can enter it below.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        {email && <form action={verifyEmailCode} className="form-stack">
          <input type="hidden" name="email" value={email} />
          <label>Verification Code<input className="verify-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" required /></label>
          <SubmitButton pendingLabel="Verifying…">Verify And Continue</SubmitButton>
        </form>}
        <form action={resendVerificationCode} className="form-stack">
          <label>Email address<input name="email" type="email" autoComplete="email" defaultValue={email} required /></label>
          <SubmitButton pendingLabel="Requesting…">Send a new confirmation email</SubmitButton>
        </form>
        {email && <div className="verification-existing-account">
          <p className="field-help">Already confirmed this email, or stopped during setup?</p>
          <form action={resumeRegistration}>
            <input type="hidden" name="email" value={email} />
            <SubmitButton className="button button-outline" pendingLabel="Preparing…">Continue Existing Account</SubmitButton>
          </form>
        </div>}
        <Link className="arrow-link" href="/login">← Back To Sign In</Link>
      </section>
    </main>
  )
}
