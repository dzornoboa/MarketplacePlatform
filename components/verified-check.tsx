/* The WTC Accra verified check: a black check mark shown beside members whose
   registration was verified by an administrator. Renders nothing otherwise. */
export function VerifiedCheck({ verified, size = 16, label = 'Verified by WTC Accra' }: { verified: boolean | null | undefined; size?: number; label?: string }) {
  if (!verified) return null
  return <span className="vcheck" role="img" aria-label={label} title={label} style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 1.5l2.6 2.1 3.3-.5 1.2 3.1 3 1.6-.6 3.3 2 2.7-2 2.7.6 3.3-3 1.6-1.2 3.1-3.3-.5L12 22.5l-2.6-2.1-3.3.5-1.2-3.1-3-1.6.6-3.3-2-2.7 2-2.7-.6-3.3 3-1.6 1.2-3.1 3.3.5z" fill="currentColor" />
      <path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
}
