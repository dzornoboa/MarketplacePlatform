'use client'

import { useState } from 'react'

export function VerifiedMemberShareActions({
  username,
  fullName,
}: {
  username: string
  fullName: string
}) {
  const [copied, setCopied] = useState(false)
  const publicBase = (process.env.NEXT_PUBLIC_MEMBER_PROFILE_BASE_URL || 'https://wtcaccra.com').replace(/\/$/, '')
  const profileUrl = `${publicBase}/member/${encodeURIComponent(username)}`
  const pdfUrl = `/api/verified-member/${encodeURIComponent(username)}/pdf`
  const shareText = `${fullName} is verified on WTC Accra Hub. Connect with @${username} to explore trusted trade, investment and partnership opportunities.`

  const nativeShare = async () => {
    try {
      const absoluteProfile = profileUrl
      const response = await fetch(pdfUrl)
      if (response.ok) {
        const blob = await response.blob()
        const file = new File([blob], `${username}-wtc-accra-verified.pdf`, { type: 'application/pdf' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: 'WTC Accra Verified Member', text: shareText, url: absoluteProfile, files: [file] })
          return
        }
      }
      if (navigator.share) {
        await navigator.share({ title: 'WTC Accra Verified Member', text: shareText, url: absoluteProfile })
        return
      }
      await navigator.clipboard.writeText(absoluteProfile)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // User cancellation is not an error that needs a visible alert.
    }
  }

  const copyLink = async () => {
    const value = profileUrl
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const encodedUrl = encodeURIComponent(profileUrl)
  const encodedText = encodeURIComponent(shareText)

  return <div className="verified-share-actions">
    <a className="button button-primary" href={pdfUrl} download>Download PDF</a>
    <button className="button button-secondary" type="button" onClick={nativeShare}>Share Card</button>
    <a className="button button-outline" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer">LinkedIn</a>
    <a className="button button-outline" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">Facebook</a>
    <a className="button button-outline" href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noreferrer">X</a>
    <a className="button button-outline" href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noreferrer">WhatsApp</a>
    <button className="button button-outline" type="button" onClick={copyLink}>{copied ? 'Copied' : 'Copy Link'}</button>
  </div>
}
