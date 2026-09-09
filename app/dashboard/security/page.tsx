import { requireUserProfile } from '@/lib/auth/guards'
import { isAdminRole } from '@/lib/auth/access'
import { MfaClient } from './mfa-client'

type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> }
export default async function SecurityPage({searchParams}:Props){const {profile}=await requireUserProfile();const params=await searchParams;const required=params.required==='admin-mfa'||isAdminRole(profile.system_role);return <div className="page-stack narrow-content"><div><p className="eyebrow">Security</p><h1>Two-factor authentication</h1><p className="muted">WTC Accra administrators must use MFA. Other members may enable it for stronger account protection.</p></div>{params.required==='admin-mfa'&&<div className="restriction-banner"><div><strong>Administrative access requires MFA</strong><p>Complete two-factor authentication to continue to the admin console.</p></div></div>}<MfaClient adminRequired={required}/></div>}
