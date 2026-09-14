import { labelForParticipantType } from '@/lib/auth/access'

/* The tag every member carries: the participant type they registered as.
   Until WTC Accra approves the type it shows the requested one, marked pending. */
export function ParticipantBadge({ type, requested, size = 'sm' }: { type: string | null | undefined; requested?: string | null; size?: 'sm' | 'md' }) {
  const shown = type ?? requested ?? null
  if (!shown) return null
  const pending = !type && !!requested
  return <span className={`ptype ptype-${shown}${pending ? ' ptype-pending' : ''}${size === 'md' ? ' ptype-md' : ''}`} title={pending ? 'Requested type — awaiting WTC Accra approval' : 'Registered participant type'}>
    {labelForParticipantType(shown)}{pending ? ' · pending' : ''}
  </span>
}
