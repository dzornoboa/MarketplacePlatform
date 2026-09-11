import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

/* Cookie-less anon client for public, cacheable content. The cookie-aware
   server client would opt any page that uses it out of static rendering, so
   anonymous reads of published site content go through this one instead. */
export function createPublicClient() {
  const { url, publishableKey } = getSupabasePublicConfig()
  return createSupabaseClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
