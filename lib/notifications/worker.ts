import { notificationDestination } from './destination'
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

const DELIVERY_LEASE_MS = 5 * 60_000
type QueueTable = 'outbound_emails' | 'outbound_pushes'

function availableLease(now: string) {
  return `delivery_lease_until.is.null,delivery_lease_until.lt.${now}`
}

async function claimDelivery(admin: SupabaseClient<Database>, table: QueueTable, id: string) {
  const now = Date.now()
  const lease = new Date(now + DELIVERY_LEASE_MS).toISOString()
  const { data, error } = await admin.from(table).update({ delivery_lease_until: lease })
    .eq('id', id).eq('status', 'queued').or(availableLease(new Date(now).toISOString())).select('id').maybeSingle()
  if (error) console.error('Notification claim failed', table, error.code)
  return data ? lease : null
}

async function finishDelivery(admin: SupabaseClient<Database>, table: QueueTable, id: string, lease: string,
  result: { status?: string; sent_at?: string; error?: string | null }) {
  const { data, error } = await admin.from(table).update({ ...result, delivery_lease_until: null })
    .eq('id', id).eq('status', 'queued').eq('delivery_lease_until', lease).select('id').maybeSingle()
  if (error) console.error('Notification status update failed', table, error.code)
  return Boolean(data)
}

/* Queued bodies are plain text; wrap them in the WTC Accra shell so members
   receive a branded message with the contact line on every email. */
function brandedHtml(subject: string, body: string, unsubscribeUrl?: string | null, passwordLink?: string): string {
  const esc = (v: string) => v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
  const paragraphs = body.split(/\n{2,}/).map(part => `<p style="margin:0 0 14px;line-height:1.55">${esc(part).replace(/\n/g, "<br />")}</p>`).join("")
  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#1d2733;max-width:560px;margin:0 auto;padding:24px">
    <p style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#E4580A;font-weight:800;margin:0 0 6px">World Trade Centre Accra</p>
    <h1 style="font-size:19px;color:#154074;margin:0 0 16px">${esc(subject)}</h1>
    ${paragraphs}
    ${passwordLink ? `<p><a href="${esc(passwordLink)}" style="color:#154074;font-weight:700">Choose a new password</a></p>` : ''}
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
    .or(availableLease(new Date().toISOString()))
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
    const lease = await claimDelivery(admin, 'outbound_emails', row.id)
    if (!lease) continue
    try {
      const marketing = /^(marketing|waitlist|newsletter|campaign)/i.test(row.kind)
      const unsubscribeUrl = marketing && row.to_user_id
        ? marketingUnsubscribeUrl(getSiteUrl(), row.to_user_id, row.to_email)
        : null
      if (marketing && !unsubscribeUrl) throw new Error('Marketing email blocked: configure EMAIL_UNSUBSCRIBE_SECRET and associate the message with a user before sending.')
      let body = row.body
      let passwordLink: string | undefined
      if (row.kind === 'password_reset') {
        const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: row.to_email })
        if (error || !row.to_user_id || data.user?.id !== row.to_user_id || !data.properties?.hashed_token) {
          throw new Error('Could not generate the password reset link.')
        }
        const link = new URL('/auth/confirm', getSiteUrl())
        link.searchParams.set('type', 'recovery')
        link.searchParams.set('token_hash', data.properties.hashed_token)
        passwordLink = link.toString()
        body = 'You requested a new password for your WTC Accra Hub account. If you did not request this, you can ignore this email.'
      }
      const postal = 'World Trade Centre Accra, 22 Independence Avenue, Accra, Ghana'
      const textFooter = `\n\n—\n${postal}\n+233 302 631 437 · membership@wtcaccra.com${unsubscribeUrl ? `\nUnsubscribe from marketing emails: ${unsubscribeUrl}` : ''}`
      await mailer.sendMail({
        from, to: row.to_email, replyTo, subject: row.subject,
        text: body + (passwordLink ? `\n\nChoose a new password: ${passwordLink}` : '') + textFooter,
        html: brandedHtml(row.subject, body, unsubscribeUrl, passwordLink),
        ...(unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
      })
      if (await finishDelivery(admin, 'outbound_emails', row.id, lease, { status: 'sent', sent_at: new Date().toISOString(), error: null })) sent += 1
    } catch (error) {
      const message = row.kind === 'password_reset' ? 'Password reset email could not be sent.' : error instanceof Error ? error.message : 'Send failed'
      await finishDelivery(admin, 'outbound_emails', row.id, lease, { status: 'failed', error: message })
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
    .or(availableLease(new Date().toISOString()))
    .order('created_at', { ascending: true }).limit(BATCH_SIZE)
  let sent = 0
  let ranOut = false
  // Same budget as the mail drain: answer in time, leave the rest for the next pass.
  const deadline = Date.now() + SEND_BUDGET_MS
  for (const row of rows ?? []) {
    if (Date.now() > deadline) { ranOut = true; break }
    const lease = await claimDelivery(admin, 'outbound_pushes', row.id)
    if (!lease) continue
    const { data: subs, error: subscriptionError } = await admin.from('push_subscriptions').select('*').eq('user_id', row.user_id)
    if (subscriptionError) {
      console.error('Push subscription lookup failed; notification remains queued', subscriptionError.code)
      await finishDelivery(admin, 'outbound_pushes', row.id, lease, {})
      continue
    }
    if (!subs || subs.length === 0) {
      await finishDelivery(admin, 'outbound_pushes', row.id, lease, { status: 'no_subscription' })
      continue
    }
    const payload = JSON.stringify({ title: row.title, body: row.body ?? '', href: notificationDestination(row) || '/dashboard/notifications' })
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
      if (await finishDelivery(admin, 'outbound_pushes', row.id, lease, { status: 'sent', sent_at: new Date().toISOString(), error: null })) sent += 1
    } else {
      await finishDelivery(admin, 'outbound_pushes', row.id, lease, { status: 'failed', error: lastError || 'No subscription accepted the push.' })
    }
  }
  return { attempted: rows?.length ?? 0, sent, ...(ranOut ? { note: 'Time ran out — the rest stay queued for the next pass' } : {}) }
}
