import { PublicPage } from '@/components/public-page'

export const revalidate = 300

export const metadata = {
  title: 'Membership',
  description: 'Participant types, verification and annual subscription plans for the WTC Accra trade and investment marketplace.',
}

export default function MembershipPage() {
  return <PublicPage slug="membership" />
}
