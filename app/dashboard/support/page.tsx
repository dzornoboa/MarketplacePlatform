import { requireUserProfile } from '@/lib/auth/guards'

export default async function SupportPage() {
  await requireUserProfile()
  return <div className="page-stack narrow-content"><div><p className="eyebrow">Support</p><h1>WTC Accra platform support</h1><p className="muted">Use this area when you need help with verification, membership status or account access.</p></div><section className="card"><h2>Before contacting support</h2><p>Check your Profile and Verification pages first. If WTC Accra requested changes, the reviewer note appears in your verification history.</p></section></div>
}
