import { PublicPage } from '@/components/public-page'

export const revalidate = 300

export const metadata = {
  title: 'Contact',
  description: 'Reach World Trade Centre Accra for membership, verification, marketplace, billing or partnership enquiries.',
}

export default function ContactPage() {
  return <PublicPage slug="contact" />
}
