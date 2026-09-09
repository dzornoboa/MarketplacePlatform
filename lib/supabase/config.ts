const DEFAULT_SUPABASE_URL = 'https://migtjpveavdrkbtonelf.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kEU-L4hoZqAIs3g2z9ya2Q_nOVWk8tm'
const DEFAULT_SITE_URL = 'https://wtcaccrahub.vercel.app'

type PublicEnv = Record<string, string | undefined>

export function getSupabasePublicConfig(env: PublicEnv = process.env) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  }
}

export function getSiteUrl(env: PublicEnv = process.env) {
  return (env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')
}
