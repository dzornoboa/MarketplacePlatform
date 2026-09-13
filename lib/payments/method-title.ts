import type { Database } from '@/lib/database.types'

type Method = Pick<Database['public']['Tables']['payment_methods']['Row'], 'kind' | 'brand' | 'last4' | 'momo_network' | 'momo_number' | 'bank_name'>

/* Human label for a saved payment method; shared by server and client. */
export function methodTitle(m: Method): string {
  if (m.kind === 'card') return `${m.brand ?? 'Card'} •••• ${m.last4 ?? '????'}`
  if (m.kind === 'mobile_money') return `${m.momo_network ?? 'Mobile money'} ${m.momo_number ? `•••• ${m.momo_number.slice(-4)}` : ''}`
  return `Bank transfer${m.bank_name ? ` · ${m.bank_name}` : ''}`
}
