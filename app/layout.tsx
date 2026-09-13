import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { AuthLinkHandler } from '@/components/auth-link-handler'
import { MenuAutoClose } from '@/components/menu-autoclose'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'WTC Accra Hub', template: '%s · WTC Accra Hub' },
  description: 'Connecting Businesses, Globally. A verified business, buyer and investor network by World Trade Centre Accra.',
  icons: { icon: '/brand/website-tab.png' },
}

// Open Sans is the WTCA brand font for both the logo lockup and all copy.
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" /></head><body><Suspense fallback={null}><AuthLinkHandler /><MenuAutoClose /></Suspense>{children}</body></html>
}
