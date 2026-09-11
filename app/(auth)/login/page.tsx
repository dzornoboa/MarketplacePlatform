import Link from 'next/link'
import { login } from '../actions'
import { BrandCircle, Logo, LogoLink } from '@/components/brand'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const next = typeof params.next === 'string' ? params.next : '/dashboard'

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <LogoLink />
        <p className="eyebrow">Member access</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to your verified business and investment network.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form action={login} className="form-stack">
          <input type="hidden" name="next" value={next} />
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button button-primary" type="submit">Sign in</button>
        </form>
        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/register">Create an account</Link>
        </div>
      </section>
      <aside className="auth-aside">
        <BrandCircle className="motif motif-aside" stroke={2} />
        <Logo variant="white" />
        <p className="eyebrow light">Private marketplace</p>
        <h2>Opportunity access for <strong>verified members</strong></h2>
        <p>Opportunities, match recommendations and deal documents stay protected until WTC Accra verifies your account.</p>
        <p className="quote">Connecting Businesses, Globally.</p>
      </aside>
    </main>
  )
}
