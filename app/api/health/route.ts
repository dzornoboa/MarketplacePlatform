import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* Pinged every few minutes by a database cron so the serverless function
   stays warm; members then skip the cold start on sign-in. */
export function GET() {
  return NextResponse.json({ ok: true, at: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } })
}
