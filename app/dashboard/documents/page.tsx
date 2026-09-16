import { requireUserProfile } from '@/lib/auth/guards'
import { SubmitButton } from '@/components/submit-button'
import { humanize } from '@/lib/auth/access'
import { DOCUMENT_PURPOSES, purposeLabel, requiredDocuments, requirementNote, purposeLabels } from '@/lib/kyc'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { uploadDocument, deleteDocument, setDocumentPurpose } from './actions'

export const dynamic = 'force-dynamic'

const SCOPE_HELP: Record<string, string> = {
  private: 'Only you and WTC Accra staff.',
  verified: 'Any subscribed member viewing the linked published opportunity.',
  granted: 'Only people you have been granted access to individually.',
}

function fileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function DocumentsPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const wanted = typeof params.purpose === 'string' && (DOCUMENT_PURPOSES as readonly string[]).includes(params.purpose) ? params.purpose : null
  const myType = profile.participant_type ?? profile.requested_participant_type
  const { count: orgCount } = await supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
  const hasOrg = (orgCount ?? 0) > 0

  const [{ data: documents }, { data: myOpportunities }] = await Promise.all([
    supabase.from('document_records').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('opportunities').select('id,title').eq('owner_user_id', profile.id).order('updated_at', { ascending: false }),
  ])
  const oppById = new Map((myOpportunities ?? []).map(o => [o.id, o.title]))
  const canUpload = profile.account_status === 'active' || profile.account_status === 'pending'

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Secure storage</p>
      <h1>Documents</h1>
      <p className="muted">Files live in a private bucket. Links are signed and expire after two minutes, so they cannot be forwarded and reused.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {!canUpload
      ? <section className="restriction-banner">
          <div><strong>Account not active</strong><p>Document upload is paused while your account is not active.</p></div>
          <a className="button button-light" href="/dashboard/support">Contact support</a>
        </section>
      : <form action={uploadDocument} className="card form-stack">
          <h2>Upload a document</h2>
          {profile.system_role === 'user' && <p className="field-help">{requirementNote(myType, hasOrg)} Still needed: {requiredDocuments(myType, hasOrg).filter(r => !(documents ?? []).some(d => d.purpose === r)).map(purposeLabel).join(', ') || 'nothing — all required documents are uploaded'}.</p>}
          <label>File<input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" /></label>
          <p className="field-help">PDF, PNG, JPEG, DOCX or XLSX. Maximum 25MB.</p>
          <div className="form-grid">
            <label>What is this document
              <select name="purpose" defaultValue={wanted ?? 'general'}>
                {DOCUMENT_PURPOSES.map(v => <option key={v} value={v}>{purposeLabels[v]}</option>)}
              </select>
            </label>
            <label>Who may see it
              <select name="accessScope" defaultValue="private">
                <option value="private">Private — only me and WTC Accra</option>
                <option value="verified">Verified members viewing the opportunity</option>
                <option value="granted">Only people I grant access to</option>
              </select>
            </label>
            <label>Attach to an opportunity
              <select name="opportunityId" defaultValue="">
                <option value="">Not linked</option>
                {(myOpportunities ?? []).map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </label>
          </div>
          <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
        </form>}

    {(documents ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>No documents yet</h2><p>Upload teasers, financials or compliance paperwork and control exactly who can open them.</p></section>
      : <section className="card table-wrap">
          <h2>Your documents</h2>
          <table className="data-table">
            <thead><tr><th>File</th><th>Type</th><th>Visibility</th><th>Linked to</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
            <tbody>{(documents ?? []).map(doc => <tr key={doc.id}>
              <td><strong>{doc.file_name}</strong></td>
              <td>{doc.owner_user_id === profile.id
                ? <form action={setDocumentPurpose} className="inline-select"><input type="hidden" name="documentId" value={doc.id} />
                    <select name="purpose" defaultValue={doc.purpose}>{DOCUMENT_PURPOSES.map(v => <option key={v} value={v}>{purposeLabel(v)}</option>)}</select>
                    <button className="link-button" type="submit">Save</button>
                  </form>
                : purposeLabel(doc.purpose)}</td>
              <td><span className={`status-dot status-doc-${doc.access_scope}`}>{humanize(doc.access_scope)}</span><br /><span className="field-help">{SCOPE_HELP[doc.access_scope]}</span></td>
              <td>{doc.opportunity_id ? oppById.get(doc.opportunity_id) ?? 'An opportunity' : '—'}</td>
              <td>{fileSize(doc.size_bytes)}</td>
              <td>{dateTime(doc.created_at)}</td>
              <td>
                <div className="button-row">
                  <a className="button button-outline" href={`/api/documents/${doc.id}`} target="_blank" rel="noopener">Open</a>
                  {doc.owner_user_id === profile.id && <form action={deleteDocument}><input type="hidden" name="documentId" value={doc.id} /><button className="button button-danger" type="submit">Delete</button></form>}
                </div>
              </td>
            </tr>)}</tbody>
          </table>
        </section>}
  </div>
}
