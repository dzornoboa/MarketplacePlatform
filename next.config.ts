import type { NextConfig } from 'next'

/* CSP is generated per request in lib/supabase/proxy.ts so scripts receive a
   fresh nonce. Keep non-CSP hardening headers here to avoid a second, weaker
   policy containing unsafe-inline/wildcard image sources. */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), browsing-topics=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Set by `next upgrade --agent=security` when moving to 16.4.6 for a
  // published advisory. It marks this app as taking security updates.
  experimental: { agentUpgrade: 'security' },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
