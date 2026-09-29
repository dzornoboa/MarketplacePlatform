'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const back = (kind: 'message' | 'error', text: string) => `/admin/backups?${kind}=${encodeURIComponent(text)}`

export async function createBackup(formData: FormData) {
  const label = String(formData.get('label') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_platform_backup', {
    backup_label: label || null,
    backup_note: note || null,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/backups')
  revalidatePath('/admin/audit')
  redirect(back('message', 'Backup created successfully.'))
}

export async function restoreBackup(formData: FormData) {
  const backupId = String(formData.get('backupId') ?? '')
  const mode = String(formData.get('mode') ?? 'merge')
  const confirmation = String(formData.get('confirmation') ?? '').trim()
  if (!backupId || !['merge','reset'].includes(mode)) redirect(back('error', 'Invalid restore request.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('restore_platform_backup', {
    backup_id: backupId,
    restore_mode: mode,
    confirmation_text: confirmation || null,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin', 'layout')
  revalidatePath('/dashboard', 'layout')
  redirect(back('message', mode === 'reset' ? 'Platform reset to the selected restore point.' : 'Backup merged into the current platform data.'))
}

export async function updateBackupMetadata(formData: FormData) {
  const backupId = String(formData.get('backupId') ?? '')
  const label = String(formData.get('label') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()
  const supabase = await createClient()
  const { error } = await supabase.rpc('rename_platform_backup', {
    backup_id: backupId,
    new_label: label,
    new_note: note || null,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/backups')
  redirect(back('message', 'Backup details updated.'))
}

export async function deleteBackup(formData: FormData) {
  const backupId = String(formData.get('backupId') ?? '')
  const confirmation = String(formData.get('confirmation') ?? '').trim()
  if (confirmation !== 'DELETE BACKUP') redirect(back('error', 'Type DELETE BACKUP to confirm.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_platform_backup', { backup_id: backupId })
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/backups')
  revalidatePath('/admin/audit')
  redirect(back('message', 'Backup deleted.'))
}
