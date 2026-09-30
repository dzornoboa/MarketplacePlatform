import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

/* Server-only privileged client. Never import this module into a Client Component.
   It is used only for narrowly-scoped server actions that must call RPCs which
   are deliberately not exposed to anon/authenticated browser clients. */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('Server administration client is not configured.')
  const { url } = getSupabasePublicConfig()
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
