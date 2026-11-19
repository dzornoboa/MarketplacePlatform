import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'
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
  const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', userId).maybeSingle()
  if (!profile || profile.account_status === 'suspended' || profile.account_status === 'disabled') return NextResponse.json({ error: 'Account access required' }, { status: 403 })
  let report
  let reportKind: AdminReport | MemberReport
  if (scope === 'admin') {
    const { data: capabilities, error: capabilityError } = await supabase.rpc('my_staff_capabilities')
    if (profile.account_status !== 'active' || claimsData?.claims?.aal !== 'aal2' || capabilityError || !(capabilities as string[] | null)?.includes('reports')) {
      return NextResponse.json({ error: 'Reports access and MFA required' }, { status: 403 })
    }
    const kind = (ADMIN_REPORTS as readonly string[]).includes(params.kind ?? '') ? (params.kind as AdminReport) : 'members'
    reportKind = kind
    report = await adminReport(supabase, kind, params)
  } else {
    const kind = (MEMBER_REPORTS as readonly string[]).includes(params.kind ?? '') ? (params.kind as MemberReport) : 'listings'
    reportKind = kind
    report = await memberReport(supabase, kind, params, userId)
  }
  const name = `wtc-${scope}-${reportKind}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse('﻿' + toCsv(report), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' } })
}
