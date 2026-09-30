import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

/* The VAPID public key is intentionally public. Serving it at runtime avoids
   Next.js build-time NEXT_PUBLIC_* substitution leaving an otherwise correctly
   configured deployment reporting "Push is not configured". The private VAPID
   key never leaves the server. */
export async function GET() {
  // The VAPID public key is designed to be public. This endpoint never returns
  // the private key or any credential, so it can also be used as a deployment
  // health check without requiring a member session.
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
  const hasPublicKey = !!publicKey
  const hasPrivateKey = !!process.env.VAPID_PRIVATE_KEY
  const hasSubject = !!process.env.VAPID_SUBJECT
  const configured = hasPublicKey && hasPrivateKey
  return NextResponse.json(
    {
      configured,
      publicKey: configured ? publicKey : null,
      diagnostics: {
        publicKey: hasPublicKey,
        privateKey: hasPrivateKey,
        subject: hasSubject,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
