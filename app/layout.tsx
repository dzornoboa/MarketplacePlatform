import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Open_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { AuthLinkHandler } from '@/components/auth-link-handler'
import { MenuAutoClose } from '@/components/menu-autoclose'
import { FloatingDock } from '@/components/floating-dock'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { AutoTranslate } from '@/components/auto-translate'
import { AutoPagination } from '@/components/auto-pagination'
import { CurrencyConversion } from '@/components/currency-conversion'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'WTC Accra Hub', template: '%s · WTC Accra Hub' },
  description: 'Connecting Businesses, Globally. A verified business, buyer and investor network by World Trade Centre Accra.',
  icons: { icon: '/brand/website-tab.png' },
  manifest: '/manifest.json',
}

export const viewport = { themeColor: '#154074' }

// Next downloads Open Sans at build time and serves it from this application,
// so browsers never contact Google Fonts directly.
const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-open-sans',
})

// Open Sans is the WTCA brand font for both the logo lockup and all copy.
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className={openSans.variable}><Suspense fallback={null}><AuthLinkHandler /><MenuAutoClose /><AutoPagination /><FloatingDock /><ServiceWorkerRegister /><AutoTranslate /><CurrencyConversion /></Suspense>{children}</body></html>
}
