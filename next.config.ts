import type { NextConfig } from 'next'

const supabaseHost = (() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host } catch { return '' } })()

/* Browser-side hardening. The CSP allows only this origin, Supabase (REST,
   auth, storage, realtime websockets), Vercel analytics and inline styles
   (Next injects them); everything else is refused by the browser. */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Next.js needs inline bootstrap scripts; no remote script hosts are allowed.
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
  `connect-src 'self' ${supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : ''} https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://api.paystack.co`,
  "frame-src 'self' https://checkout.paystack.com",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), browsing-topics=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
