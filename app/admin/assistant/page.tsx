import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { AdminAgent } from '@/components/admin-agent'
import { aiAvailable } from '@/lib/ai/client'

export const dynamic = 'force-dynamic'

export default async function AdminAssistantPage() {
  await requireSuperAdmin()
  const enabled = aiAvailable()
  return <div className="page-stack">
    <div>
      <p className="eyebrow">Super administrator</p>
      <h1>AI operations agent</h1>
      <p className="muted">Instruct it in plain English and it works the console for you — with your permissions, your audit trail. Reads are instant; changes only happen when “Allow actions” is on. <Link className="arrow-link" href="/admin/insights">KPIs and graphs →</Link></p>
    </div>
    {!enabled && <div className="alert alert-error">ANTHROPIC_API_KEY is not set on the server, so the agent cannot run. Add it as an environment variable in Vercel and redeploy.</div>}
    <AdminAgent enabled={enabled} />
  </div>
}
