import Link from 'next/link'
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
              <option value="investor">Investor</option>
              <option value="buyer">Buyer</option>
              <option value="business">Business</option>
              <option value="project_sponsor">Project sponsor</option>
              <option value="wtc_association_member">WTC Association member</option>
              <option value="wtc_accra_member">WTC Accra member</option>
            </select>
          </label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <p className="field-help">Use at least 8 characters with upper and lowercase letters and a number.</p>
          <button className="button button-primary" type="submit">Create account</button>
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
