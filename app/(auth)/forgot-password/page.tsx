import Link from 'next/link'
import { requestPasswordReset } from '../actions'
import { LogoLink } from '@/components/brand'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  return (
    <main className="center-page">
      <section className="card auth-card">
        <LogoLink />
        <p className="eyebrow">Account recovery</p>
        <h1>Reset your password</h1>
        <p className="muted">Enter the email address used for your WTC Accra Hub account.</p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form action={requestPasswordReset} className="form-stack">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <button className="button button-primary" type="submit">Send reset link</button>
        </form>
        <div className="reset-help">
          <strong>If the link does not work</strong>
          <ul className="plain-list">
            <li>Reset links expire after a short time and work only once — always use the newest email.</li>
            <li>Open the link in the same browser you requested it from.</li>
            <li>Some corporate mail filters open links automatically to scan them, which can use up the link before you click it. If that keeps happening, ask WTC Accra to reset your password directly.</li>
            <li>Check your spam or junk folder.</li>
          </ul>
        </div>
        <Link className="arrow-link" href="/login">← Back to sign in</Link>
      </section>
    </main>
  )
}
