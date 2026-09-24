import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import webpush from 'web-push'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

const BATCH_SIZE = 25

/* Queued bodies are plain text; wrap them in the WTC Accra shell so members
   receive a branded message with the contact line on every email. */
function brandedHtml(subject: string, body: string): string {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const paragraphs = body.split(/\n{2,}/).map(part => `<p style="margin:0 0 14px;line-height:1.55">${esc(part).replace(/\n/g, "<br />")}</p>`).join("")
  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#1d2733;max-width:560px;margin:0 auto;padding:24px">
    <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#E4580A;font-weight:800;margin:0 0 6px">World Trade Centre Accra</p>
    <h1 style="font-size:19px;color:#154074;margin:0 0 16px">${esc(subject)}</h1>
    ${paragraphs}
    <p style="margin:22px 0 0;font-size:12.5px;color:#5b6470;border-top:1px solid #e3e7ec;padding-top:12px">World Trade Centre Accra · +233 302 631 437 · membership@wtcaccra.com</p>
  </div>`
}

export function adminClient(): SupabaseClient<Database> | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  const { url } = getSupabasePublicConfig()
  return createSupabaseClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

/* Drains the outbound_emails queue via Resend. Rows stay 'queued' (never
   mislabeled 'failed') when RESEND_API_KEY simply isn't configured yet. */
export async function drainEmails(admin: SupabaseClient<Database>) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { attempted: 0, sent: 0, note: 'RESEND_API_KEY not set — left queued' }
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM || 'WTC Accra Hub <onboarding@resend.dev>'

  const { data: rows } = await admin.from('outbound_emails').select('*').eq('status', 'queued')
    .order('created_at', { ascending: true }).limit(BATCH_SIZE)
  let sent = 0
  for (const row of rows ?? []) {
    const { error } = await resend.emails.send({ from, to: row.to_email, subject: row.subject, text: row.body, html: brandedHtml(row.subject, row.body), replyTo: process.env.EMAIL_REPLY_TO || "membership@wtcaccra.com" })
    if (error) {
      await admin.from('outbound_emails').update({ status: 'failed', error: error.message }).eq('id', row.id)
    } else {
      await admin.from('outbound_emails').update({ status: 'sent', sent_at: new Date().toISOString(), error: null }).eq('id', row.id)
      sent += 1
    }
  }
  return { attempted: rows?.length ?? 0, sent }
}

/* Drains the outbound_pushes queue via Web Push. Rows stay 'queued' when
   VAPID keys aren't configured yet; a subscription rejected as gone
   (404/410) is removed so it isn't retried forever. */
export async function drainPushes(admin: SupabaseClient<Database>) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return { attempted: 0, sent: 0, note: 'VAPID keys not set — left queued' }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:membership@wtcaccra.com', publicKey, privateKey)

  const { data: rows } = await admin.from('outbound_pushes').select('*').eq('status', 'queued')
    .order('created_at', { ascending: true }).limit(BATCH_SIZE)
  let sent = 0
  for (const row of rows ?? []) {
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', row.user_id)
    if (!subs || subs.length === 0) {
      await admin.from('outbound_pushes').update({ status: 'no_subscription' }).eq('id', row.id)
      continue
    }
    const payload = JSON.stringify({ title: row.title, body: row.body ?? '', href: row.href ?? '/dashboard/notifications' })
    let delivered = false
    let lastError = ''
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        delivered = true
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          lastError = err instanceof Error ? err.message : 'Push send failed'
        }
      }
    }
    if (delivered) {
      await admin.from('outbound_pushes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', row.id)
      sent += 1
    } else {
      await admin.from('outbound_pushes').update({ status: 'failed', error: lastError || 'No subscription accepted the push.' }).eq('id', row.id)
    }
  }
  return { attempted: rows?.length ?? 0, sent }
}
