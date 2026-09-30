import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'
import { labelForParticipantType } from '@/lib/auth/access'
import { allow } from '@/lib/security/throttle'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '?'
}

function fitText(text: string, max = 62) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 3) + '...' : clean
}

async function embedRemoteImage(pdf: PDFDocument, url: string | null | undefined, allowedHosts: Set<string>) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.host)) return null
    const response = await fetch(parsed, { cache: 'no-store', redirect: 'error' })
    if (!response.ok) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    const type = response.headers.get('content-type') ?? ''
    if (type.includes('png') || url.toLowerCase().includes('.png')) return await pdf.embedPng(bytes)
    if (type.includes('jpeg') || type.includes('jpg') || /\.jpe?g($|\?)/i.test(url)) return await pdf.embedJpg(bytes)
    return null
  } catch {
    return null
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!(await allow('verified_pdf', 20, 600))) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  const { username } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('public_verified_member_profile', { member_username: username })
  const member = data?.[0]
  if (error || !member) return NextResponse.json({ error: 'Verified member not found.' }, { status: 404 })

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

  const navy = rgb(0.047, 0.235, 0.427)
  const orange = rgb(0.925, 0.302, 0.02)
  const ink = rgb(0.08, 0.12, 0.18)
  const muted = rgb(0.34, 0.39, 0.46)
  const light = rgb(0.96, 0.97, 0.98)

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1,1,1) })
  page.drawRectangle({ x: 0, y: height - 10, width, height: 10, color: orange })

  const requestUrl = new URL(request.url)
  const supabaseHost = new URL(getSupabasePublicConfig().url).host
  const allowedHosts = new Set([requestUrl.host, supabaseHost])
  let logo = null
  try {
    const logoBytes = await readFile(path.join(process.cwd(), 'public', 'brand', 'wtc-accra-logo-black.png'))
    logo = await pdf.embedPng(logoBytes)
  } catch {
    logo = null
  }
  if (logo) {
    const scale = Math.min(190 / logo.width, 38 / logo.height)
    page.drawImage(logo, { x: 52, y: height - 92, width: logo.width * scale, height: logo.height * scale })
  } else {
    page.drawText('WORLD TRADE CENTRE ACCRA', { x: 52, y: height - 72, size: 17, font: bold, color: ink })
  }

  page.drawText('VERIFIED MEMBER', { x: width - 190, y: height - 70, size: 11, font: bold, color: orange })

  page.drawRectangle({ x: 46, y: 430, width: width - 92, height: 285, color: light, borderColor: rgb(.86,.88,.91), borderWidth: 1 })

  const avatar = await embedRemoteImage(pdf, member.avatar_url, allowedHosts)
  if (avatar) {
    const side = 110
    page.drawImage(avatar, { x: 72, y: 555, width: side, height: side })
  } else {
    page.drawCircle({ x: 127, y: 610, size: 55, color: navy })
    page.drawText(initials(member.full_name), { x: 102, y: 595, size: 26, font: bold, color: rgb(1,1,1) })
  }

  page.drawCircle({ x: 178, y: 563, size: 16, color: ink })
  page.drawLine({ start: { x: 170, y: 563 }, end: { x: 176, y: 556 }, thickness: 3, color: rgb(1,1,1) })
  page.drawLine({ start: { x: 176, y: 556 }, end: { x: 188, y: 570 }, thickness: 3, color: rgb(1,1,1) })

  page.drawText(fitText(member.full_name, 36), { x: 210, y: 635, size: 23, font: bold, color: navy })
  page.drawText('@' + member.username, { x: 210, y: 610, size: 13, font: bold, color: ink })
  if (member.job_title) page.drawText(fitText(member.job_title, 44), { x: 210, y: 585, size: 12, font: regular, color: muted })

  const role = labelForParticipantType(member.participant_type)
  const location = [member.city, member.country].filter(Boolean).join(', ')
  page.drawText(fitText(role + (location ? ' - ' + location : ''), 58), { x: 210, y: 562, size: 10.5, font: regular, color: muted })

  page.drawText('YOU ARE VERIFIED ON WTC ACCRA HUB', { x: 72, y: 515, size: 15, font: bold, color: orange })
  page.drawText('Connect with me on WTC Accra Hub to explore trusted trade, investment', { x: 72, y: 486, size: 11.5, font: regular, color: ink })
  page.drawText('and partnership opportunities through the World Trade Centre Accra network.', { x: 72, y: 468, size: 11.5, font: regular, color: ink })

  const publicBase = (process.env.NEXT_PUBLIC_MEMBER_PROFILE_BASE_URL || 'https://wtcaccra.com').replace(/\/$/, '')
  const profileUrl = `${publicBase}/member/${encodeURIComponent(member.username)}`
  page.drawRectangle({ x: 72, y: 440, width: width - 144, height: 22, color: rgb(1,1,1), borderColor: rgb(.82,.85,.88), borderWidth: 1 })
  page.drawText(fitText(profileUrl, 78), { x: 82, y: 447, size: 9, font: regular, color: navy })

  page.drawText('Verified by World Trade Centre Accra', { x: 52, y: 74, size: 10, font: bold, color: ink })
  page.drawText('Share this card and invite trusted contacts to connect with you on WTC Accra Hub.', { x: 52, y: 55, size: 9, font: regular, color: muted })

  const bytes = await pdf.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${member.username}-wtc-accra-verified.pdf"`,
      'cache-control': 'no-store',
    },
  })
}
