import { PublicPage } from '@/components/public-page'

export const revalidate = 300

export const metadata = {
  title: 'About WTC Accra',
  description: 'World Trade Centre Accra is Ghana’s licensed member of the World Trade Centers Association, connecting Ghanaian enterprise to a worldwide trade network.',
}

export default function AboutPage() {
  return <PublicPage slug="about" />
}
