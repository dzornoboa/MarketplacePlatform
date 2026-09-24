import { NextResponse, type NextRequest } from 'next/server'
import { adminClient, drainEmails, drainPushes } from '@/lib/notifications/worker'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* Woken by a Postgres trigger (net.http_post) right after a row lands in
   outbound_emails/outbound_pushes, and by a pg_cron safety net every 2
   minutes in case a wake-up ping is ever missed. Shared secret only —
   nothing here is reachable without it. */
export async function POST(request: NextRequest) {
  const expected = process.env.INTERNAL_NOTIFICATION_SECRET
  if (!expected || request.headers.get('x-internal-secret') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = adminClient()
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })

  const [emails, pushes] = await Promise.all([drainEmails(admin), drainPushes(admin)])
  return NextResponse.json({ ok: true, emails, pushes }, { headers: { 'cache-control': 'no-store' } })
}
