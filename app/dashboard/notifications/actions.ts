'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function me() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null
  if (!userId) redirect('/login')
  return { supabase, userId }
}
const done = (msg: string) => { revalidatePath('/dashboard/notifications'); revalidatePath('/dashboard'); redirect(`/dashboard/notifications?message=${encodeURIComponent(msg)}`) }

export async function markAllRead() {
  const { supabase, userId } = await me()
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)
  done('All notifications marked as read.')
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
  if (action === 'read') {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).in('id', ids)
    done(`${ids.length} marked as read.`)
  }
  if (action === 'unread') {
    await supabase.from('notifications').update({ read_at: null }).eq('user_id', userId).in('id', ids)
    done(`${ids.length} marked as unread.`)
  }
  redirect('/dashboard/notifications')
}
