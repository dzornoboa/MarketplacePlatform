import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { selectableParticipantTypes, participantTypeLabels } from '@/lib/auth/access'
import { signup } from '../actions'
import { BrandCircle, Logo, LogoLink } from '@/components/brand'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null

  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel-wide">
        <LogoLink />
        <p className="eyebrow">Join the platform</p>
        <h1>Create your account</h1>
        <p className="muted">You can sign in immediately after email confirmation, but opportunity access remains restricted until admin verification.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form action={signup} className="form-stack">
          <label>Full name<input name="fullName" autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Account type
            <select name="participantType" required defaultValue="">
              <option value="" disabled>Select account type</option>
              {selectableParticipantTypes.map(type => <option key={type} value={type}>{participantTypeLabels[type]}</option>)}
            </select>
          </label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <p className="field-help">Use at least 8 characters with upper and lowercase letters and a number.</p>
          <SubmitButton>Create account</SubmitButton>
        </form>
        <div className="auth-links"><span>Already registered?</span><Link href="/login">Sign in</Link></div>
      </section>
      <aside className="auth-aside">
        <BrandCircle className="motif motif-aside" stroke={2} />
        <Logo variant="white" />
        <p className="eyebrow light">Verification first</p>
        <h2>A trusted network, <strong>not an open deal directory</strong></h2>
        <p>WTC Accra reviews participant information before unlocking private opportunities and member privileges.</p>
        <p className="quote">Connecting Businesses, Globally.</p>
      </aside>
    </main>
  )
}
