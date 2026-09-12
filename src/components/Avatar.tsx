import { avatarUrl } from '@/api'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Profile photo with a monogram fallback. `name` seeds the initials shown when
 * there is no photo — pass the person's real name, never an email.
 */
export function Avatar({
  name,
  avatarKey,
  size = 48,
  className = '',
}: {
  name: string
  avatarKey?: string | null
  size?: number
  className?: string
}): React.ReactElement {
  const src = avatarUrl(avatarKey)
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full border border-line bg-surface object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-bamboo-soft font-display font-semibold text-bamboo-deep ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
    >
      {initials(name) || 'S'}
    </span>
  )
}
