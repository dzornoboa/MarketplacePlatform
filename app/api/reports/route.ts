import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'
import { hasCapability, isAdminRole, hasAdminMfaAccess } from '@/lib/auth/access'
import { adminReport, memberReport, toCsv, ADMIN_REPORTS, MEMBER_REPORTS, type AdminReport, type MemberReport, type ReportParams } from '@/lib/reports'

export const dynamic = 'force-dynamic'

/* CSV download for the report shown on screen. Same filters, same rows. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!(await allow('report_csv', 30, 600))) return NextResponse.json({ error: 'Too many exports. Try again in a few minutes.' }, { status: 429 })
  const params: ReportParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const scope = params.scope === 'admin' ? 'admin' : 'member'
  let report
  if (scope === 'admin') {
    const { data: profile } = await supabase.from('profiles').select('system_role').eq('id', userId).single()
    const role = profile?.system_role
    const aal = typeof claimsData?.claims?.aal === 'string' ? claimsData.claims.aal : null
    if (!role || !hasCapability(role, 'reports') || (isAdminRole(role) && !hasAdminMfaAccess(role, aal))) return NextResponse.json({ error: 'Reports access required' }, { status: 403 })
    const kind = (ADMIN_REPORTS as readonly string[]).includes(params.kind ?? '') ? (params.kind as AdminReport) : 'members'
    report = await adminReport(supabase, kind, params)
  } else {
    const kind = (MEMBER_REPORTS as readonly string[]).includes(params.kind ?? '') ? (params.kind as MemberReport) : 'listings'
    report = await memberReport(supabase, kind, params, userId)
  }
  const name = `wtc-${scope}-${params.kind ?? 'report'}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse('﻿' + toCsv(report), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' } })
}
