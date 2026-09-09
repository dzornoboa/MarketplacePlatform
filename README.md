# WTC Accra Hub

Next.js 16 + Supabase foundation for the WTC Accra private trade and investment marketplace.

## Architecture
- Next.js App Router on Vercel
- Supabase Auth, PostgreSQL and Row Level Security
- `@supabase/ssr` cookie sessions
- Public marketing site with no opportunity catalogue
- Authenticated member dashboard
- Verified-only opportunity routes
- Admin verification queue protected by AAL2 MFA
- Shared Supabase backend ready for future Flutter mobile apps

## Environment
Copy `.env.example` to `.env.local` for local development. Production requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`.

## Verification
Run `npm run test:unit`, `npm run typecheck`, and `npm run build` before release.
