import ExcelJS from 'exceljs'
import { NextResponse, type NextRequest } from 'next/server'
import { requireAdminProfile } from '@/lib/auth/guards'
import { auditAction, auditActor, auditDetails, auditExportLimit, auditFilters, auditLabel, readAuditActors, readAuditEvents } from '@/lib/audit/log'

export async function GET(request: NextRequest) {
  const { supabase } = await requireAdminProfile()
  const filters = auditFilters(request.nextUrl.searchParams)
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Audit log', { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = [
    { header: 'Time (UTC)', width: 24, style: { numFmt: 'dd mmm yyyy hh:mm:ss' } },
    { header: 'Action', width: 34 },
    { header: 'Entity', width: 24 },
    { header: 'Actor', width: 32 },
    { header: 'Details', width: 78, style: { alignment: { wrapText: true, vertical: 'top' } } },
    { header: 'Event ID', width: 16 },
    { header: 'Action code', width: 32 },
    { header: 'Entity ID', width: 39 },
    { header: 'Actor ID', width: 39 },
  ]
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF154074' } }

  const batchSize = 250
  for (let offset = 0; offset < auditExportLimit; offset += batchSize) {
    const { data: events, error } = await readAuditEvents(supabase, filters, offset, batchSize)
    if (error) return NextResponse.json({ error: 'Could not export audit events.' }, { status: 500 })
    const { data: actors, error: actorError } = await readAuditActors(supabase, events)
    if (actorError) return NextResponse.json({ error: 'Could not export audit actor names.' }, { status: 500 })
    const names = new Map((actors ?? []).map(actor => [actor.id, actor.full_name]))
    for (const event of events) {
      sheet.addRow([
        new Date(event.created_at), auditAction(event.action), auditLabel(event.entity_type), auditActor(event, names),
        auditDetails(event.details).map(([key, value]) => `${key}: ${value}`).join('\n').slice(0, 32767),
        event.id, event.action, event.entity_id, event.actor_id,
      ])
    }
    if (events.length < batchSize) break
  }

  sheet.autoFilter = 'A1:I1'
  const bytes = await workbook.xlsx.writeBuffer()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': 'attachment; filename="wtc-accra-audit-log.xlsx"',
      'cache-control': 'private, no-store',
    },
  })
}
