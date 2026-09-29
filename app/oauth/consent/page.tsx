import { redirect } from 'next/navigation'
import { LogoLink } from '@/components/brand'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const scopeLabels: Record<string, string> = {
  openid: 'Confirm your WTC Accra Hub identity',
  email: 'View your email address and verification status',
  profile: 'View your basic profile information',
  phone: 'View your phone number and verification status',
}

export default async function OAuthConsentPage({ searchParams }: Props) {
  const params = await searchParams
  const authorizationId = typeof params.authorization_id === 'string' ? params.authorization_id : ''

  if (!authorizationId) {
    return <main className="center-page"><section className="card auth-card"><LogoLink /><p className="eyebrow">OAuth Authorization</p><h1>Invalid Authorization Request</h1><p className="muted">The request is missing its authorization identifier.</p></section></main>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`)

  const { data: details, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
  if (error || !details) {
    return <main className="center-page"><section className="card auth-card"><LogoLink /><p className="eyebrow">OAuth Authorization</p><h1>Authorization Request Unavailable</h1><p className="muted">{error?.message ?? 'This authorization request is invalid or has expired.'}</p></section></main>
  }

  if (!('authorization_id' in details)) redirect(details.redirect_url)

  const scopes = (details.scope ?? '').split(' ').filter(Boolean)

  return <main className="center-page">
    <section className="card auth-card oauth-consent-card">
      <LogoLink />
      <p className="eyebrow">Authorize Application</p>
      <h1>Allow {details.client.name} To Access Your Account?</h1>
      <p className="muted">This application is requesting permission to use your WTC Accra Hub identity. Review the requested information before you approve.</p>

      <dl className="detail-grid detail-grid-two">
        <div><dt>Application</dt><dd>{details.client.name}</dd></div>
        <div><dt>Signed In As</dt><dd>{user.email}</dd></div>
      </dl>

      {scopes.length > 0 && <div className="oauth-scope-list">
        <h2>Requested Permissions</h2>
        <ul className="plain-list">{scopes.map(scope => <li key={scope}><strong>{scope}</strong> — {scopeLabels[scope] ?? 'Access requested by this application'}</li>)}</ul>
      </div>}

      <p className="field-help">Only approve applications you trust. OAuth access continues to respect the platform&apos;s database access rules.</p>
      <form action="/api/oauth/decision" method="post" className="button-row">
        <input type="hidden" name="authorization_id" value={authorizationId} />
        <button className="button button-primary" type="submit" name="decision" value="approve">Approve Access</button>
        <button className="button button-outline" type="submit" name="decision" value="deny">Deny</button>
      </form>
    </section>
  </main>
}
