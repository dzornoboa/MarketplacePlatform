'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markAllRead() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return
  await supabase.from('notifications').update({ read_at: new Date().toISOString() })
    .eq('user_id', String(userId)).is('read_at', null)
  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
}
