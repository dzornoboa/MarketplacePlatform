import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

/* Rate limiting is executed with the server-only Supabase service role.
   The public/anonymous roles cannot call the throttle RPC directly, which
   prevents attackers from bypassing or polluting the limiter through REST. */
export async function clientKey(): Promise<string> {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown').split(',')[0].trim()
  const salt = process.env.THROTTLE_SALT ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'wtc'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

export async function allow(bucket: string, max: number, windowSeconds: number, extraKey?: string): Promise<boolean> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return false
    const { url } = getSupabasePublicConfig()
    const admin = createSupabaseClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const hint = extraKey
      ? `${await clientKey()}:${createHash('sha256').update(extraKey.toLowerCase()).digest('hex').slice(0, 16)}`
      : await clientKey()
    const { data, error } = await admin.rpc('throttle', {
      bucket,
      max_hits: max,
      window_seconds: windowSeconds,
      subject_hint: hint,
    })
    if (error) return false
    return data !== false
  } catch {
    return false
  }
}
