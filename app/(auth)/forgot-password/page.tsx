import Link from 'next/link'
import { requestPasswordReset } from '../actions'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  return (
    <main className="center-page">
      <section className="card auth-card">
        <p className="eyebrow">Account recovery</p><h1>Reset your password</h1>
        <p className="muted">Enter the email address used for your WTC Accra Hub account.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form action={requestPasswordReset} className="form-stack">
          <label>Email<input name="email" type="email" required /></label>
          <button className="button button-primary" type="submit">Send reset email</button>
        </form>
        <Link href="/login">Back to sign in</Link>
      </section>
    </main>
  )
}
