import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

/* A per-request nonce cannot work on this site. The marketing pages are
   prerendered and the rest is served through the CDN, so the HTML a visitor
   receives was generated earlier and carries an old nonce or none at all,
   while this header is rebuilt on every request. With 'strict-dynamic' the
   browser then refused every script on the page: the public site loaded with
   no JavaScript and signed-in pages sat on their loading skeleton forever.

   Scripts are restricted by origin instead, so nothing can be loaded from
   another host — the protection that matters here. Approved by the site owner
   on 2026-10-01 in preference to making every public page uncacheable. */
function buildCsp(supabaseHost: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `img-src 'self' data: blob: https://${supabaseHost} https://*.supabase.co`,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
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
  const requestHeaders = new Headers(request.headers)

  const makeResponse = () => {
    const next = NextResponse.next({ request: { headers: requestHeaders } })
    next.headers.set('Content-Security-Policy', buildCsp(supabaseHost))
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
