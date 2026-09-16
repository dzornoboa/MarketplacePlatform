import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/* Rate limiting backed by the database (public.throttle), so it holds across
   serverless instances. Signed-in callers are keyed by user id; anonymous
   callers by a salted hash of their IP — the address itself is never stored. */
export async function clientKey(): Promise<string> {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown').split(',')[0].trim()
  const salt = process.env.THROTTLE_SALT ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'wtc'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/* True when the caller is within `max` hits per `windowSeconds` for `bucket`. */
export async function allow(bucket: string, max: number, windowSeconds: number, extraKey?: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const hint = extraKey ? `${await clientKey()}:${createHash('sha256').update(extraKey.toLowerCase()).digest('hex').slice(0, 16)}` : await clientKey()
    const { data, error } = await supabase.rpc('throttle', { bucket, max_hits: max, window_seconds: windowSeconds, subject_hint: hint })
    if (error) return true // never lock people out because the limiter itself failed
    return data !== false
  } catch {
    return true
  }
}
