'use client'

import { useState } from 'react'

export function CopyMembershipIds({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false)
  if (!lines.length) return null
  const copy = async () => {
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  return <button type="button" className="button button-outline" onClick={copy}>{copied ? 'Copied' : 'Copy IDs'}</button>
}
