import test from 'node:test'
import assert from 'node:assert/strict'
import { DOCUMENT_LIMIT, MAX_DOCUMENT_BYTES, documentUploadError } from '../lib/document-uploads.ts'

test('document uploads accept exactly 1 MB and reject larger or unsupported files', () => {
  assert.equal(DOCUMENT_LIMIT, 5)
  assert.equal(MAX_DOCUMENT_BYTES, 1024 * 1024)
  const pdf = (size: number) => new File([new Uint8Array(size)], 'proof.pdf', { type: 'application/pdf' })
  assert.equal(documentUploadError(pdf(MAX_DOCUMENT_BYTES)), null)
  assert.match(documentUploadError(pdf(MAX_DOCUMENT_BYTES + 1)) ?? '', /1 MB/)
  assert.match(documentUploadError(new File(['text'], 'file.txt', { type: 'text/plain' })) ?? '', /PDF/)
  assert.match(documentUploadError(pdf(0)) ?? '', /Choose a file/)
})
