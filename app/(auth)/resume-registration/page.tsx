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
  return <main className="center-page"><section className="card auth-card">
    <LogoLink />
    <p className="eyebrow">Continue Registration</p>
    <h1>Continue Your Existing Account</h1>
    <p className="muted">Enter the email you used previously. We will send the appropriate secure email to continue without revealing account status on this page.</p>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}
    <form action={resumeRegistration} className="form-stack">
      <label>Email Address<input name="email" type="email" autoComplete="email" defaultValue={email} required /></label>
      <SubmitButton pendingLabel="Preparing…">Continue Account Setup</SubmitButton>
    </form>
    <div className="button-row"><Link className="arrow-link" href="/register">← Back To Registration</Link>{email && <Link className="arrow-link" href={`/login?email=${encodeURIComponent(email)}&next=/dashboard/profile`}>Sign In Instead →</Link>}</div>
  </section></main>
}
