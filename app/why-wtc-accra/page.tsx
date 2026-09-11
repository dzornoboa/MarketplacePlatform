import { PublicPage } from '@/components/public-page'

export const revalidate = 300

export const metadata = {
  title: 'Why WTC Accra',
  description: 'Connection, credibility, marquee standing and neutral positioning — what membership of the World Trade Centers Association delivers.',
}

export default function WhyWtcAccraPage() {
  return <PublicPage slug="why-wtc-accra" />
}
