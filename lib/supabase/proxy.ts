import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

function buildCsp(nonce: string, supabaseHost: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `img-src 'self' data: blob: https://${supabaseHost} https://*.supabase.co https://encrypted-tbn0.gstatic.com`,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://api.paystack.co https://open.er-api.com https://translation.googleapis.com https://api.anthropic.com`,
    "frame-src 'self' https://checkout.paystack.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
}

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicConfig()
  const supabaseHost = new URL(url).host
  const nonce = crypto.randomUUID().replaceAll('-', '')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', buildCsp(nonce, supabaseHost))

  const makeResponse = () => {
    const next = NextResponse.next({ request: { headers: requestHeaders } })
    next.headers.set('Content-Security-Policy', buildCsp(nonce, supabaseHost))
    return next
  }

  let response = makeResponse()
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = makeResponse()
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  await supabase.auth.getClaims()
  return response
}
