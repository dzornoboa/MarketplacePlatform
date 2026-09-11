import { PublicPage } from '@/components/public-page'

export const revalidate = 300

export const metadata = {
  title: 'How it works',
  description: 'From registration to a trusted business connection: verification, subscription and the access controls that protect every listing.',
}

export default function HowItWorksPage() {
  return <PublicPage slug="how-it-works" />
}
