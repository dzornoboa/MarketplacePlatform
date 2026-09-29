import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasAdminMfaAccess } from '@/lib/auth/access'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims?.sub) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { data: boot } = await supabase.rpc('session_bootstrap')
  const profile = (boot as { profile?: { system_role?: string } } | null)?.profile
  const aal = typeof claims.aal === 'string' ? claims.aal : null
  if (!profile || !hasAdminMfaAccess(profile.system_role, aal)) {
    return NextResponse.json({ error: 'Administrator access with MFA is required' }, { status: 403 })
  }

  const { data: backup, error } = await supabase.from('platform_backups').select('*').eq('id', id).maybeSingle()
  if (error || !backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 })

  const body = JSON.stringify({
    format: 'wtc-accra-hub-logical-backup-v1',
    exported_at: new Date().toISOString(),
    backup: {
      id: backup.id,
      label: backup.label,
      note: backup.note,
      scope: backup.scope,
      created_at: backup.created_at,
      table_counts: backup.table_counts,
      snapshot: backup.snapshot,
    },
  }, null, 2)

  const safe = String(backup.label || 'wtc-accra-backup').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${safe || 'wtc-accra-backup'}-${backup.created_at.slice(0,10)}.json"`,
      'cache-control': 'no-store',
    },
  })
}
