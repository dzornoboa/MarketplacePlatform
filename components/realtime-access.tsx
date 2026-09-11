'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* Keeps an open dashboard in step with the database. When WTC Accra verifies an
   account, changes its marketplace switches, or a notification arrives, the
   server components re-render without the member reloading the page.
   RLS still applies to the realtime stream, so a member only ever receives
   rows they were already allowed to read. */
export function RealtimeAccess({ userId }: { userId: string }) {
  const router = useRouter()
  const [banner, setBanner] = useState<string | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Bursts of changes (approve + notify + audit) collapse into one refresh.
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => router.refresh(), 400)
    }

    const channel = supabase
      .channel(`member-access-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, payload => {
        const next = payload.new as Record<string, unknown>
        const previous = payload.old as Record<string, unknown>
        if (next.verification_status !== previous?.verification_status) {
          setBanner(`Verification status updated to ${String(next.verification_status).replaceAll('_', ' ')}.`)
        } else if (next.can_view_opportunities !== previous?.can_view_opportunities || next.can_post_opportunities !== previous?.can_post_opportunities) {
          setBanner('Your marketplace access was updated by WTC Accra.')
        } else if (next.account_status !== previous?.account_status) {
          setBanner(`Account status updated to ${String(next.account_status)}.`)
        }
        scheduleRefresh()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        const row = payload.new as { title?: string }
        if (row?.title) setBanner(row.title)
        scheduleRefresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${userId}` }, () => {
        setBanner('Your subscription was updated.')
        scheduleRefresh()
      })
      .subscribe()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      void supabase.removeChannel(channel)
    }
  }, [router, userId])

  if (!banner) return null
  return <div className="realtime-toast" role="status" aria-live="polite">
    <span>{banner}</span>
    <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss">×</button>
  </div>
}
