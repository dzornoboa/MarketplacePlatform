import { redirect } from 'next/navigation'

export default function LegacyBidsPage() {
  redirect('/admin/deals')
}
