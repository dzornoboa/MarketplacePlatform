import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifyEmailCode, resendVerificationCode } from '../actions'
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
  const wtc = email.toLowerCase().endsWith('@wtcaccra.com')

  return (
    <main className="center-page">
      <section className="card auth-card">
        <LogoLink />
        <p className="eyebrow">Verify your email</p>
        <h1>Enter the code we sent</h1>
        <p className="muted">A 6-digit verification code has been sent to <strong>{email}</strong>.{wtc ? ' WTC member accounts are only created once the @wtcaccra.com address is confirmed.' : ' Your account activates as soon as you enter it.'}</p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form action={verifyEmailCode} className="form-stack">
          <input type="hidden" name="email" value={email} />
          <label>Verification code<input className="verify-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" required autoFocus /></label>
          <SubmitButton pendingLabel="Verifying…">Verify and continue</SubmitButton>
        </form>
        <form action={resendVerificationCode} className="field-help">
          <input type="hidden" name="email" value={email} />
          Didn&apos;t get it? Check your spam folder or <button className="link-button" type="submit">send a new code</button>. The link in the email works too.
        </form>
        <Link className="arrow-link" href="/login">← Back to sign in</Link>
      </section>
    </main>
  )
}
