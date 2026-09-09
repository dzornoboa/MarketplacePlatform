import { updatePassword } from '../actions'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  return (
    <main className="center-page">
      <section className="card auth-card">
        <p className="eyebrow">Choose a new password</p><h1>Update password</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form action={updatePassword} className="form-stack">
          <label>New password<input name="password" type="password" minLength={8} required /></label>
          <label>Confirm password<input name="confirmPassword" type="password" minLength={8} required /></label>
          <button className="button button-primary" type="submit">Update password</button>
        </form>
      </section>
    </main>
  )
}
