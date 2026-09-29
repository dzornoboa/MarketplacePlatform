import { requireAdminProfile } from '@/lib/auth/guards'
import { dateTime } from '@/lib/format'
import { humanize } from '@/lib/auth/access'
import { SubmitButton } from '@/components/submit-button'
import { createBackup, restoreBackup, updateBackupMetadata, deleteBackup } from './actions'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> }

function countRows(counts: unknown) {
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return 0
  return Object.values(counts as Record<string, unknown>).reduce((n,v) => n + (typeof v === 'number' ? v : 0), 0)
}

export default async function BackupAdminPage({ searchParams }: Props) {
  const { supabase, profile } = await requireAdminProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const superAdmin = profile.system_role === 'super_admin'

  const [{ data: backups }, { data: creators }] = await Promise.all([
    supabase.from('platform_backups').select('id,label,note,scope,table_counts,created_by,created_at,last_restored_at,last_restored_by,restore_count,status').order('created_at', { ascending:false }).limit(1000),
    supabase.from('profiles').select('id,full_name').neq('system_role','user'),
  ])
  const names = new Map((creators ?? []).map(p => [p.id,p.full_name]))

  return <div className="page-stack">
    <RealtimeRefresh tables={['platform_backups']} />
    <div>
      <p className="eyebrow">Data Protection</p>
      <h1>Backup And Restore</h1>
      <p className="muted">Administrators can create and export complete application-data restore points. Restore, reset, editing and deletion are restricted to Super Administrators.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card">
      <h2>Create Restore Point</h2>
      <p className="muted">The snapshot includes public application data for all users, staff, listings, deals, memberships, billing records, website content and platform configuration. It also includes the administrator creating the backup.</p>
      <form action={createBackup} className="form-stack">
        <label>Backup Name<input name="label" placeholder="e.g. Before October Membership Update" /></label>
        <label>Notes<textarea name="note" rows={2} placeholder="Optional reason or change reference" /></label>
        <SubmitButton pendingLabel="Creating Backup…">Create Full Backup</SubmitButton>
      </form>
      <p className="field-help">Authentication passwords, active sessions and Storage file binaries are not duplicated into this logical restore point. Database references and file metadata are included.</p>
    </section>

    <section className="card table-wrap">
      <h2>Restore Points</h2>
      {(backups ?? []).length === 0 ? <p className="muted">No backups have been created yet.</p> : <table className="data-table">
        <thead><tr><th>Created</th><th>Name</th><th>Created By</th><th>Records</th><th>Restores</th><th>Status</th><th>Export</th><th>{superAdmin ? 'Super Admin Controls' : 'Access'}</th></tr></thead>
        <tbody>{(backups ?? []).map(backup => <tr key={backup.id}>
          <td>{dateTime(backup.created_at)}</td>
          <td><strong>{backup.label}</strong>{backup.note && <><br /><small>{backup.note}</small></>}</td>
          <td>{names.get(backup.created_by) ?? 'Administrator'}</td>
          <td>{countRows(backup.table_counts).toLocaleString()}</td>
          <td>{backup.restore_count}{backup.last_restored_at ? <><br /><small>Last {dateTime(backup.last_restored_at)}</small></> : null}</td>
          <td>{humanize(backup.status)}</td>
          <td><a className="button button-outline" href={`/api/admin/backups/${backup.id}`}>Export JSON</a></td>
          <td>{superAdmin ? <details className="backup-actions">
            <summary className="button button-outline">Manage</summary>
            <div className="backup-actions-panel form-stack">
              <form action={updateBackupMetadata} className="form-stack">
                <input type="hidden" name="backupId" value={backup.id} />
                <label>Name<input name="label" defaultValue={backup.label} required /></label>
                <label>Notes<textarea name="note" rows={2} defaultValue={backup.note ?? ''} /></label>
                <SubmitButton pendingLabel="Saving…">Save Details</SubmitButton>
              </form>
              <hr />
              <form action={restoreBackup} className="form-stack">
                <input type="hidden" name="backupId" value={backup.id} />
                <input type="hidden" name="mode" value="merge" />
                <p className="field-help"><strong>Merge Restore:</strong> updates backed-up records while preserving newer records not in the backup.</p>
                <SubmitButton className="button button-secondary" pendingLabel="Restoring…">Merge Restore</SubmitButton>
              </form>
              <form action={restoreBackup} className="form-stack danger-zone">
                <input type="hidden" name="backupId" value={backup.id} />
                <input type="hidden" name="mode" value="reset" />
                <p className="field-help"><strong>Reset To Restore Point:</strong> replaces restorable application data with this snapshot. An automatic pre-reset safety backup is created first.</p>
                <input name="confirmation" placeholder="Type RESET" required />
                <SubmitButton className="button button-danger" pendingLabel="Resetting…">Reset To This Point</SubmitButton>
              </form>
              <form action={deleteBackup} className="form-stack danger-zone">
                <input type="hidden" name="backupId" value={backup.id} />
                <input name="confirmation" placeholder="Type DELETE BACKUP" required />
                <SubmitButton className="button button-danger" pendingLabel="Deleting…">Delete Backup</SubmitButton>
              </form>
            </div>
          </details> : <span className="field-help">Backup + export only</span>}</td>
        </tr>)}</tbody>
      </table>}
    </section>
  </div>
}
