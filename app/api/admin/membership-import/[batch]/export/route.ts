import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function csvCell(value: unknown) {
  const text = String(value ?? '')
  return '"' + text.replaceAll('"', '""') + '"'
}

export async function GET(_request: Request, { params }: { params: Promise<{ batch: string }> }) {
  const { batch } = await params
  const supabase = await createClient()
  const { data: caps } = await supabase.rpc('my_staff_capabilities')
  if (!(caps ?? []).includes('membership_ids')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: rows, error } = await supabase.from('membership_import_rows')
    .select('row_number,full_name,email,organisation_name,membership_type_code,member_code,status,user_id,activation_error')
    .eq('batch_id', batch)
    .order('row_number')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const header = ['row_number','full_name','email','organisation_name','membership_type','membership_id','status','user_id','activation_error']
  const lines = [
    header.map(csvCell).join(','),
    ...(rows ?? []).map(row => [
      row.row_number,row.full_name,row.email,row.organisation_name,row.membership_type_code,row.member_code,row.status,row.user_id,row.activation_error,
    ].map(csvCell).join(',')),
  ]

  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="membership-import-${batch}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
