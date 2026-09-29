import Link from 'next/link'
import { resumeRegistration } from '../actions'
import { LogoLink } from '@/components/brand'
import { SubmitButton } from '@/components/submit-button'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ResumeRegistrationPage({ searchParams }: Props) {
  const params = await searchParams
  const email = typeof params.email === 'string' ? params.email : ''
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const existing = params.existing === '1'
  return <main className="center-page"><section className="card auth-card">
    <LogoLink />
    <p className="eyebrow">Continue Registration</p>
    <h1>Continue Your Existing Account</h1>
    <p className="muted">{existing ? 'This email already belongs to a confirmed account. Continue with the saved account instead of starting over.' : 'Enter the email you used previously. If your email still needs confirmation, we will send a fresh verification message. If the account is already confirmed, we will send a secure password link so you can continue with the information already saved in the system.'}</p>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}
    <form action={resumeRegistration} className="form-stack">
      <label>Email Address<input name="email" type="email" autoComplete="email" defaultValue={email} required /></label>
      <SubmitButton pendingLabel="Checking…">{existing ? 'Send Secure Continue Link' : 'Continue Account Setup'}</SubmitButton>
    </form>
    <div className="button-row"><Link className="arrow-link" href="/register">← Back To Registration</Link>{email && <Link className="arrow-link" href={`/login?email=${encodeURIComponent(email)}&next=/dashboard/profile`}>Sign In Instead →</Link>}</div>
  </section></main>
}
