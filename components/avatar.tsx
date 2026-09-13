/* A member's profile image, or their initials on a brand-coloured disc when
   they have not uploaded one. Server-safe (no hooks). */
const COLORS = ['#123B6D', '#E85D0C', '#2A9D8F', '#B56576', '#6D597A', '#0F766E']

export function Avatar({ src, name, size = 40, className = '' }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  const label = (name ?? '').trim()
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
  const hue = COLORS[(label.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % COLORS.length]
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }
  return src
    ? <img className={`avatar ${className}`} src={src} alt={label || 'Profile photo'} width={size} height={size} style={style} />
    : <span className={`avatar avatar-initials ${className}`} style={{ ...style, background: hue }} aria-label={label || 'Member'}>{initials}</span>
}
