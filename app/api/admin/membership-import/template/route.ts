import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import { membershipImportColumns } from '@/lib/membership/import'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: caps } = await supabase.rpc('my_staff_capabilities')
  if (!(caps ?? []).includes('membership_ids')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Members')
  sheet.addRow([...membershipImportColumns])
  sheet.addRow([
    'Ama Mensah',
    'ama@example.com',
    'Example Company Ltd',
    '+233201234567',
    'Ghana',
    'GH',
    'Accra',
    'Managing Director',
    'WTC Accra',
    '1990-01-15',
    'national_id',
    'GHA-000000000-0',
    'GHS',
  ])
  sheet.getRow(1).font = { bold: true }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  const widths = [24,28,28,18,18,14,18,24,22,18,20,24,20]
  sheet.columns.forEach((column, index) => { column.width = widths[index] ?? 20 })

  const bytes = await workbook.xlsx.writeBuffer()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': 'attachment; filename="membership-import-template.xlsx"',
      'cache-control': 'no-store',
    },
  })
}
