import test from 'node:test'
import assert from 'node:assert/strict'
import { getSupabasePublicConfig, getSiteUrl } from '../lib/supabase/config.ts'

test('public Supabase config has safe production fallbacks', () => {
  const config = getSupabasePublicConfig({})
  assert.equal(config.url, 'https://migtjpveavdrkbtonelf.supabase.co')
  assert.match(config.publishableKey, /^sb_publishable_/)
})

test('site URL falls back to the production WTC Accra Hub URL', () => {
  assert.equal(getSiteUrl({}), 'https://wtcaccrahub.vercel.app')
})
