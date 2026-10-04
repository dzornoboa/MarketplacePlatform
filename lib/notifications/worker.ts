import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import webpush from 'web-push'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig, getSiteUrl } from '@/lib/supabase/config'
import { marketingUnsubscribeUrl } from '@/lib/email/unsubscribe'

const BATCH_SIZE = 25
// Comfortably inside the route's own 60s limit and the deadline the database
// gives the call, so the queue is always written back before anything gives up.
const SEND_BUDGET_MS = 40_000

/* Queued bodies are plain text; wrap them in the WTC Accra shell so members
   receive a branded message with the contact line on every email. */
function brandedHtml(subject: string, body: string, unsubscribeUrl?: string | null): string {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const paragraphs = body.split(/\n{2,}/).map(part => `<p style="margin:0 0 14px;line-height:1.55">${esc(part).replace(/\n/g, "<br />")}</p>`).join("")
  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#1d2733;max-width:560px;margin:0 auto;padding:24px">
    <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#E4580A;font-weight:800;margin:0 0 6px">World Trade Centre Accra</p>
    <h1 style="font-size:19px;color:#154074;margin:0 0 16px">${esc(subject)}</h1>
    ${paragraphs}
    <p style="margin:22px 0 0;font-size:12.5px;color:#5b6470;border-top:1px solid #e3e7ec;padding-top:12px">World Trade Centre Accra · 22 Independence Avenue, Accra, Ghana · +233 302 631 437 · membership@wtcaccra.com</p>
    ${unsubscribeUrl ? `<p style="margin:8px 0 0;font-size:12.5px;color:#5b6470">This is a marketing message. <a href="${esc(unsubscribeUrl)}" style="color:#154074;text-decoration:underline">Unsubscribe from marketing emails</a>.</p>` : ''}
  </div>`
}

export function adminClient(): SupabaseClient<Database> | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!serviceKey) return null
  const { url } = getSupabasePublicConfig()
  return createSupabaseClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

/* Drains the outbound_emails queue over SMTP — the same mailbox configured
   as Supabase custom SMTP, so platform mail and Supabase auth mail leave from
   one sender. Rows stay 'queued' (never mislabeled 'failed') when SMTP is
   not configured yet. */
export function smtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

function transport() {
  const port = Number(process.env.SMTP_PORT ?? 465)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 and 25 upgrade with STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASSWORD as string },
    /* Without these the library waits two minutes to connect and ten for a
       reply. A mail server that accepts the connection and then goes quiet was
       enough to keep the whole drain running past the deadline the database
       gives it, so every message stayed queued and was tried again for ever. */
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
}

/* Opens the SMTP session and authenticates without sending anything, so a
   wrong host, port, username or password is reported while the settings are
   being entered rather than discovered later by a member who never got their
   email. */
export async function verifyMailConnection(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!smtpConfigured()) return { ok: false, error: 'SMTP_HOST, SMTP_USER and SMTP_PASSWORD are not all set on this deployment.' }
  const mailer = transport()
  try {
    await mailer.verify()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'The mail server refused the connection.' }
  } finally {
    mailer.close()
  }
}

export async function drainEmails(admin: SupabaseClient<Database>) {
  if (!smtpConfigured()) return { attempted: 0, sent: 0, note: 'SMTP not configured — left queued' }
  const from = process.env.EMAIL_FROM || 'WTC Accra Hub <membership@wtcaccra.com>'
  const replyTo = process.env.EMAIL_REPLY_TO || 'membership@wtcaccra.com'
  const mailer = transport()

  const { data: rows } = await admin.from('outbound_emails').select('*').eq('status', 'queued')
    .order('created_at', { ascending: true }).limit(BATCH_SIZE)
  let sent = 0
  let ranOut = false
  /* The drain has to answer before the caller stops waiting, so it stops
     starting new messages once the budget is spent and leaves the rest for the
     next pass two minutes later, rather than being killed halfway through with
     nothing written back. */
  const deadline = Date.now() + SEND_BUDGET_MS
  for (const row of rows ?? []) {
    if (Date.now() > deadline) { ranOut = true; break }
    try {
      const marketing = /^(marketing|waitlist|newsletter|campaign)/i.test(row.kind)
      const unsubscribeUrl = marketing && row.to_user_id
        ? marketingUnsubscribeUrl(getSiteUrl(), row.to_user_id, row.to_email)
        : null
      if (marketing && !unsubscribeUrl) throw new Error('Marketing email blocked: configure EMAIL_UNSUBSCRIBE_SECRET and associate the message with a user before sending.')
      const postal = 'World Trade Centre Accra, 22 Independence Avenue, Accra, Ghana'
      const textFooter = `\n\n—\n${postal}\n+233 302 631 437 · membership@wtcaccra.com${unsubscribeUrl ? `\nUnsubscribe from marketing emails: ${unsubscribeUrl}` : ''}`
      await mailer.sendMail({
        from, to: row.to_email, replyTo, subject: row.subject,
        text: row.body + textFooter,
        html: brandedHtml(row.subject, row.body, unsubscribeUrl),
        ...(unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
      })
      await admin.from('outbound_emails').update({ status: 'sent', sent_at: new Date().toISOString(), error: null }).eq('id', row.id)
      sent += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed'
      await admin.from('outbound_emails').update({ status: 'failed', error: message }).eq('id', row.id)
    }
  }
  mailer.close()
  return { attempted: rows?.length ?? 0, sent, ...(ranOut ? { note: 'Time ran out — the rest stay queued for the next pass' } : {}) }
}

/* Drains the outbound_pushes queue via Web Push. Rows stay 'queued' when
   VAPID keys aren't configured yet; a subscription rejected as gone
   (404/410) is removed so it isn't retried forever. */
export async function drainPushes(admin: SupabaseClient<Database>) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
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
