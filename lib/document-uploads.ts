export const DOCUMENT_LIMIT = 5
export const MAX_DOCUMENT_BYTES = 1024 * 1024
export const DOCUMENT_BUCKET = 'platform-documents'
export const EXTRA_DOCUMENT_CATEGORY = 'extra_document'
export const DOCUMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.docx,.xlsx'

const allowedTypes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

export function documentUploadError(file: File | null): string | null {
  if (!file || !file.size) return 'Choose a file to upload.'
  if (file.size > MAX_DOCUMENT_BYTES) return 'Files must be 1 MB or smaller.'
  if (!allowedTypes.has(file.type)) return 'Allowed types are PDF, PNG, JPEG, DOCX and XLSX.'
  return null
}

export function documentObjectPath(ownerId: string, fileName: string) {
  return `${ownerId}/${crypto.randomUUID()}-${fileName.replace(/[^A-Za-z0-9._-]/g, '_').slice(-120)}`
}
