import ExcelJS from 'exceljs'

export type MembershipImportRow = {
  full_name: string
  email: string
  organisation_name: string
  phone: string
  country: string
  country_code: string
  city: string
  job_title: string
  wtca_chapter: string
  date_of_birth: string
  id_type: string
  id_number: string
  preferred_currency: string
}

const HEADER_MAP: Record<string, keyof MembershipImportRow> = {
  full_name: 'full_name',
  fullname: 'full_name',
  name: 'full_name',
  email: 'email',
  email_address: 'email',
  organisation_name: 'organisation_name',
  organization_name: 'organisation_name',
  organisation: 'organisation_name',
  organization: 'organisation_name',
  company: 'organisation_name',
  phone: 'phone',
  telephone: 'phone',
  country: 'country',
  country_code: 'country_code',
  countrycode: 'country_code',
  city: 'city',
  job_title: 'job_title',
  jobtitle: 'job_title',
  title: 'job_title',
  wtca_chapter: 'wtca_chapter',
  wtc_chapter: 'wtca_chapter',
  date_of_birth: 'date_of_birth',
  dob: 'date_of_birth',
  id_type: 'id_type',
  identification_type: 'id_type',
  id_number: 'id_number',
  identification_number: 'id_number',
  preferred_currency: 'preferred_currency',
  currency: 'preferred_currency',
}

const EMPTY: MembershipImportRow = {
  full_name: '', email: '', organisation_name: '', phone: '', country: '', country_code: '',
  city: '', job_title: '', wtca_chapter: '', date_of_birth: '', id_type: '', id_number: '',
  preferred_currency: 'USD',
}

function normalizeHeader(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function cellText(value: ExcelJS.CellValue | undefined): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim()
    if ('result' in value && value.result != null) return String(value.result).trim()
    if ('richText' in value && Array.isArray(value.richText)) return value.richText.map(part => part.text).join('').trim()
    if ('hyperlink' in value && typeof value.text === 'string') return value.text.trim()
  }
  return String(value).trim()
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row) }
  return rows.filter(r => r.some(v => v.trim()))
}

function mapRows(matrix: string[][]): MembershipImportRow[] {
  if (matrix.length < 2) return []
  const headers = matrix[0].map(value => HEADER_MAP[normalizeHeader(value)] ?? null)
  return matrix.slice(1).filter(row => row.some(value => String(value ?? '').trim())).map(row => {
    const out = { ...EMPTY }
    headers.forEach((key, index) => {
      if (key) out[key] = String(row[index] ?? '').trim()
    })
    out.email = out.email.toLowerCase()
    out.country_code = out.country_code.toUpperCase()
    out.preferred_currency = (out.preferred_currency || 'USD').toUpperCase()
    out.id_type = out.id_type.toLowerCase().replace(/[ -]+/g, '_')
    return out
  })
}

export async function parseMembershipImport(file: File): Promise<MembershipImportRow[]> {
  const name = file.name.toLowerCase()
  if (file.size <= 0) throw new Error('Choose a non-empty Excel or CSV file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Import files are limited to 5 MB.')

  const buffer = Buffer.from(await file.arrayBuffer())
  if (name.endsWith('.csv')) return mapRows(parseCsv(buffer.toString('utf8')))
  if (!name.endsWith('.xlsx')) throw new Error('Use an .xlsx Excel workbook or .csv file.')

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as any)
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('The workbook has no worksheet.')

  const matrix: string[][] = []
  sheet.eachRow({ includeEmpty: false }, row => {
    const values: string[] = []
    for (let i = 1; i <= Math.max(row.cellCount, row.actualCellCount); i++) values.push(cellText(row.getCell(i).value))
    matrix.push(values)
  })
  return mapRows(matrix)
}

export const membershipImportColumns = [
  'full_name','email','organisation_name','phone','country','country_code','city','job_title',
  'wtca_chapter','date_of_birth','id_type','id_number','preferred_currency',
] as const
