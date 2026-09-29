import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'success'
  const message = status === 'success'
    ? 'You have been unsubscribed from WTC Accra marketing emails. Essential account, security, billing and transaction messages may still be sent.'
    : status === 'unavailable'
      ? 'We could not update your preference automatically. Please contact membership@wtcaccra.com and we will process the request.'
      : 'This unsubscribe link is invalid or has expired. Please use the latest marketing email or contact membership@wtcaccra.com.'

  return <><PublicHeader /><main><section className="section"><div className="card empty-state">
    <p className="eyebrow">Email Preferences</p>
    <h1>Marketing Email Preference</h1>
    <p>{message}</p>
  </div></section></main><PublicFooter /></>
}
