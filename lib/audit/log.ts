import { containsPattern } from '@/lib/filters'
import type { Database, Json } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditEvent = Database['public']['Tables']['audit_events']['Row']
export const auditPageSize = 50
export const auditExportLimit = 5000

export function auditFilters(params: URLSearchParams) {
  const date = params.get('since') ?? ''
  return {
    q: (params.get('q') ?? '').trim().slice(0, 120),
    entity: (params.get('entity') ?? '').slice(0, 100),
    actor: /^[0-9a-f-]{36}$/i.test(params.get('actor') ?? '') ? params.get('actor')! : '',
    since: /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) ? date : '',
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
  }
}

export function readAuditEvents(supabase: SupabaseClient<Database>, filters: ReturnType<typeof auditFilters>, offset: number, size: number) {
  const ascending = filters.sort === 'oldest'
  let query = supabase.from('audit_events').select('*')
    .order('created_at', { ascending }).order('id', { ascending }).range(offset, offset + size - 1)
  if (filters.entity) query = query.eq('entity_type', filters.entity)
  if (filters.actor) query = query.eq('actor_id', filters.actor)
  if (filters.since) query = query.gte('created_at', `${filters.since}T00:00:00Z`)
  if (filters.q) {
    const exactCode = Object.entries(actionLabels).find(([, label]) => label.toLowerCase() === filters.q.toLowerCase())?.[0]
    if (exactCode) return query.eq('action', exactCode)
    const words = filters.q.split(/[\s._-]+/).filter(Boolean)
    if (words.length) query = query.ilike('action', `%${words.map(word => containsPattern(word).slice(1, -1)).join('%')}%`)
  }
  return query
}

export async function readAuditActors(supabase: SupabaseClient<Database>, events: AuditEvent[]) {
  const ids = [...new Set(events.flatMap(event => event.actor_id ? [event.actor_id] : []))]
  if (!ids.length) return { data: [], error: null }
  return await supabase.from('profiles').select('id,full_name').in('id', ids)
}

export function auditLabel(value: string) {
  const text = value.replace(/[._-]+/g, ' ').trim().replace(/\s+/g, ' ')
  return text.replace(/^./, first => first.toUpperCase()).replace(/\b(id|ip|url|wtc|wtca|kyc|mfa)\b/gi, word => word.toUpperCase())
}

const actionLabels: Record<string, string> = {
  'connection.requested': 'Connection requested',
  'connection.accepted': 'Connection accepted',
  'connection.staff_approve': 'Connection approved by staff',
  'connection.staff_reject': 'Connection rejected by staff',
}

export function auditAction(action: string) {
  return Object.hasOwn(actionLabels, action) ? actionLabels[action] : auditLabel(action)
}

function auditValue(value: Json): string {
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return /^[a-z]+(?:_[a-z]+)+$/.test(value) ? auditLabel(value) : value
  if (Array.isArray(value)) return value.map(auditValue).join(', ')
  return auditDetails(value).map(([key, entry]) => `${key}: ${entry}`).join('; ')
}

export function auditDetails(details: Json): Array<[string, string]> {
  if (details === null) return []
  if (typeof details !== 'object' || Array.isArray(details)) return [['Details', auditValue(details)]]
  return Object.entries(details).flatMap(([key, value]) => {
    if (key === 'actor' || value == null || value === '') return []
    return [[auditLabel(key), auditValue(value)]]
  })
}

export function auditActor(event: AuditEvent, names: Map<string, string | null>) {
  const details = event.details
  const savedName = details && typeof details === 'object' && !Array.isArray(details) && typeof details.actor === 'string' ? details.actor : ''
  return (event.actor_id ? names.get(event.actor_id) : null) || savedName || (event.actor_id ? 'Unknown actor' : 'System')
}
