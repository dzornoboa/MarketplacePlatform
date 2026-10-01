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
  const salt = process.env.THROTTLE_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'wtc-rate-limit'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/* Returns false only when the limiter actually says "too many". A limiter that
   is not configured, or that fails, must not masquerade as a rate limit: doing
   so takes registration, password reset, verification codes and support off the
   air behind a message that blames the member for sending too many requests.
   The miss is logged so the deployment problem is visible in the server log. */
let warnedUnconfigured = false
export async function allow(bucket: string, max: number, windowSeconds: number, extraKey?: string): Promise<boolean> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      if (!warnedUnconfigured) {
        warnedUnconfigured = true
        console.error('Rate limiting is switched off: SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.')
      }
      return true
    }
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
    if (error) { console.error('Rate limit check failed for bucket ' + bucket + ':', error.message); return true }
    return data !== false
  } catch {
    return true
  }
}


function subjectHintFor(extraKey?: string) {
  return extraKey
    ? clientKey().then(key => `${key}:${createHash('sha256').update(extraKey.toLowerCase()).digest('hex').slice(0, 16)}`)
    : clientKey()
}

/* Non-mutating rate-limit check used before authentication. Returns null when
   the limiter infrastructure is unavailable so a database/network fault does
   not falsely lock a legitimate member out of their account. */
export async function checkAllowed(bucket: string, max: number, windowSeconds: number, extraKey?: string): Promise<boolean | null> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return null
    const { url } = getSupabasePublicConfig()
    const admin = createSupabaseClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const subject_hint = await subjectHintFor(extraKey)
    const { data, error } = await admin.rpc('throttle_check', {
      bucket,
      max_hits: max,
      window_seconds: windowSeconds,
      subject_hint,
    })
    if (error) return null
    return data !== false
  } catch {
    return null
  }
}

export async function resetLimit(bucket: string, extraKey?: string): Promise<void> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return
    const { url } = getSupabasePublicConfig()
    const admin = createSupabaseClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await admin.rpc('throttle_reset', { bucket, subject_hint: await subjectHintFor(extraKey) })
  } catch {
    // A reset failure must never break a successful sign-in.
  }
}
