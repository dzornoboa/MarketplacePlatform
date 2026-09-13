import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { login } from '../actions'
import { BrandCircle, Logo, LogoLink } from '@/components/brand'
import { getPageBlock } from '@/lib/content/site-content'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function LoginPage({ searchParams }: Props) {
  // A signed-in visitor who lands here (e.g. from a cached header) goes to their dashboard.
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (claimsData?.claims?.sub) redirect('/dashboard')

  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const next = typeof params.next === 'string' ? params.next : '/dashboard'
  const aside = await getPageBlock('auth', 'login_aside', { eyebrow: 'Private marketplace', heading: 'Opportunity access for', heading_emphasis: 'verified members', body: 'Opportunities, match recommendations and deal documents stay protected until WTC Accra verifies your account.', cta_label: null, cta_href: null, secondary_cta_label: null, secondary_cta_href: null, image_url: null })

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
      <aside className="auth-aside" data-section="login_aside">
        <BrandCircle className="motif motif-aside" stroke={2} />
        <Logo variant="white" />
        {aside.eyebrow && <p className="eyebrow light">{aside.eyebrow}</p>}
        <h2>{aside.heading} {aside.heading_emphasis && <strong>{aside.heading_emphasis}</strong>}</h2>
        {aside.body && <p>{aside.body}</p>}
        <p className="quote">Connecting Businesses, Globally.</p>
      </aside>
    </main>
  )
}
