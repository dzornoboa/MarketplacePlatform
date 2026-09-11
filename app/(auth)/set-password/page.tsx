import { requireSession } from '@/lib/auth/guards'
import { setInitialPassword } from '../actions'
import { BrandCircle, Logo, LogoLink } from '@/components/brand'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SetPasswordPage({ searchParams }: Props) {
  const { profile } = await requireSession()
  if (!profile.password_change_required) redirect('/dashboard')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <LogoLink />
        <p className="eyebrow">Activate your account</p>
        <h1>Set your password</h1>
        <p className="muted">WTC Accra created this account for {profile.full_name || 'you'}. Choose a password you control before continuing to the dashboard.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form action={setInitialPassword} className="form-stack">
          <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
          <p className="field-help">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
          <button className="button button-primary" type="submit">Set password and continue</button>
        </form>
      </section>
      <aside className="auth-aside">
        <BrandCircle className="motif motif-aside" stroke={2} />
        <Logo variant="white" />
        <p className="eyebrow light">Account security</p>
        <h2>Your password is <strong>yours alone</strong></h2>
        <p>WTC Accra staff never see or set member passwords. The temporary credential used to reach this page stops working once you choose your own.</p>
        <p className="quote">Connecting Businesses, Globally.</p>
      </aside>
    </main>
  )
}
