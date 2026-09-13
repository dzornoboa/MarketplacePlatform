import { requireUserProfile } from '@/lib/auth/guards'
import { isAdminRole, systemRoleLabels } from '@/lib/auth/access'
import { safeNextPath } from '@/lib/auth/redirects'
import { MfaClient } from './mfa-client'
import { SubmitButton } from '@/components/submit-button'
import { changePassword } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SecurityPage({ searchParams }: Props) {
  const { supabase, profile, claims } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const admin = isAdminRole(profile.system_role)
  const required = params.required === 'admin-mfa' || admin
  const next = safeNextPath(typeof params.next === 'string' ? params.next : null, '/admin')
  const alreadyElevated = claims.aal === 'aal2'

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const hasFactor = (factors?.totp ?? []).some(f => f.status === 'verified')

  /* Two different situations, two different messages. An administrator who has
     already enrolled just needs to type their code for this session; one who
     has not needs to set the authenticator up once. */
  if (admin && !alreadyElevated) {
    return <div className="page-stack narrow-content">
      <div>
        <p className="eyebrow">{hasFactor ? 'Sign-in verification' : 'Administrator setup'}</p>
        <h1>{hasFactor ? 'Enter your authenticator code' : 'Add an authenticator to unlock the console'}</h1>
        <p className="muted">
          {hasFactor
            ? <>Your authenticator is already set up. Open the app on your phone and enter the current six-digit code to unlock the console for this session.</>
            : <>You are signed in as a <strong>{systemRoleLabels[profile.system_role]}</strong>. This account can verify members, publish listings, change any other account and edit the public site — so it requires a second factor every time it does those things.</>}
        </p>
      </div>

      {!hasFactor && <section className="card">
        <h2>How it works</h2>
        <ol className="checklist">
          <li><span aria-hidden="true">1</span><span>Install an authenticator app on your phone — Google Authenticator, Microsoft Authenticator, Authy or 1Password all work.</span><em>Once</em></li>
          <li><span aria-hidden="true">2</span><span>Press <strong>Set up authenticator</strong> below and scan the QR code with the app.</span><em>Once</em></li>
          <li><span aria-hidden="true">3</span><span>Type the six-digit code the app shows. The console unlocks straight away.</span><em>Once</em></li>
          <li><span aria-hidden="true">4</span><span>On future sign-ins, enter the current code once to reach the console.</span><em>Each session</em></li>
        </ol>
        <p className="field-help">Your password is not changed by this. If you lose the phone, WTC Accra technical support can reset the authenticator on this account.</p>
      </section>}

      <MfaClient adminRequired={true} next={next} />
    </div>
  }

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Security</p>
      <h1>Password and two-factor authentication</h1>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <form action={changePassword} className="card form-stack">
      <h2>Change password</h2>
      <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
      <div className="form-grid">
        <label>New password<input name="newPassword" type="password" autoComplete="new-password" required minLength={8} /></label>
        <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></label>
      </div>
      <p className="field-help">At least 8 characters with an uppercase letter, a lowercase letter and a number. Forgotten it? Sign out and use “Forgot password” on the sign-in page.</p>
      <div><SubmitButton pendingLabel="Changing…">Change password</SubmitButton></div>
    </form>

    <div>
      <h2>Two-factor authentication</h2>
      <p className="muted">{admin ? 'Your administrator session is verified.' : 'WTC Accra administrators must use MFA. Other members may enable it for stronger account protection.'}</p>
    </div>
    <MfaClient adminRequired={required} next={next} />
  </div>
}
