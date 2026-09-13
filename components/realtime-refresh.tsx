'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* Re-renders the current server page when any of the given tables change.
   Used by console queues (payments, subscriptions, verification, bids) so a
   member paying or an officer approving shows up without a reload. RLS
   filters the stream, so staff only receive rows they may read. */
export function RealtimeRefresh({ tables, channel = 'console-refresh' }: { tables: string[]; channel?: string }) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const key = tables.join(',')

  useEffect(() => {
    const supabase = createClient()
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => router.refresh(), 500)
    }
    let sub = supabase.channel(`${channel}-${key}`)
    for (const table of key.split(',')) {
      sub = sub.on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
    }
    sub.subscribe()
    return () => { if (timer.current) clearTimeout(timer.current); void supabase.removeChannel(sub) }
  }, [router, key, channel])

  return null
}
