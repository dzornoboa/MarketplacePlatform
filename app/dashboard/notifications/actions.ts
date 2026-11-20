'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/redirects'

async function me() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null
  if (!userId) redirect('/login')
  return { supabase, userId }
}
const done = (msg: string) => { revalidatePath('/dashboard/notifications'); revalidatePath('/dashboard'); redirect(`/dashboard/notifications?message=${encodeURIComponent(msg)}`) }

function updateFailed() {
  redirect('/dashboard/notifications?error=' + encodeURIComponent('Could not update notifications. Try again.'))
}

export async function markAllRead() {
  const { supabase, userId } = await me()
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)
  if (error) updateFailed()
  done('All notifications marked as read.')
}

/* Opening a notification is reading it. Until now only the Mark read buttons
   set read_at, so following a notification through to the thing it was about
   left it unread and the badge still counting it. */
export async function openNotification(formData: FormData) {
  const { supabase, userId } = await me()
  const id = String(formData.get('open') ?? '')
  if (!id) redirect('/dashboard/notifications')
  const { data: row } = await supabase.from('notifications')
    .select('href').eq('user_id', userId).eq('id', id).maybeSingle()
  await supabase.from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId).eq('id', id).is('read_at', null)
  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
  redirect(safeNextPath(row?.href ?? null, '/dashboard/notifications'))
}

/* Seeing the list is reading it too: once the page has shown these rows the
   badge stops counting them. Mark unread puts any of them back. */
export async function markSeen(ids: string[]) {
  const { supabase, userId } = await me()
  const wanted = ids.filter(Boolean).slice(0, 1000)
  if (wanted.length === 0) return
  await supabase.from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId).in('id', wanted).is('read_at', null)
  revalidatePath('/dashboard')
}

/* Bulk actions on the ticked notifications: `ids` are the checked rows. */
export async function bulkNotifications(formData: FormData) {
  const { supabase, userId } = await me()
  const action = String(formData.get('bulk') ?? '')
  const ids = formData.getAll('ids').map(String).filter(Boolean)
  if (action === 'delete_all') {
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId)
    if (error) redirect(`/dashboard/notifications?error=${encodeURIComponent(error.message)}`)
    done('All notifications deleted.')
  }
  if (ids.length === 0) redirect('/dashboard/notifications?error=' + encodeURIComponent('Tick at least one notification first.'))
  if (action === 'delete') {
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId).in('id', ids)
    if (error) redirect(`/dashboard/notifications?error=${encodeURIComponent(error.message)}`)
    done(`${ids.length} notification${ids.length === 1 ? '' : 's'} deleted.`)
  }
  if (action === 'read' || action === 'unread') {
    const { count, error } = await supabase.from('notifications')
      .update({ read_at: action === 'read' ? new Date().toISOString() : null }, { count: 'exact' })
      .eq('user_id', userId).in('id', ids)
    if (error || count === null) updateFailed()
    done(`${count} marked as ${action}.`)
  }
  redirect('/dashboard/notifications')
}
