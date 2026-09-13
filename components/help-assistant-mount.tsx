'use client'

import { usePathname } from 'next/navigation'
import { useSessionState } from '@/components/header-session'
import { HelpAssistant } from '@/components/help-assistant'

/* Mounted once in the root layout; hidden on auth screens and inside the
   website builder (where it would cover the properties panel). */
export function HelpAssistantMount() {
  const pathname = usePathname()
  const session = useSessionState()
  if (/^\/(login|register|forgot-password|reset-password|set-password|auth)/.test(pathname) || pathname.startsWith('/editor/builder')) return null
  return <HelpAssistant signedIn={session === 'member'} />
}
