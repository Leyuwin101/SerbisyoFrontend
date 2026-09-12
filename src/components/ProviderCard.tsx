import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Card, Stars } from '@/components/ui'
import type { ProviderSummary } from '@/types'

/** Stable tint per provider so every card gets a unique, deterministic accent. */
const TINTS = [
  'from-bamboo-soft to-gold-soft text-bamboo-deep',
  'from-gold-soft to-[#e9e2f3] text-[#8a5a10]',
  'from-[#e9e2f3] to-bamboo-soft text-[#4c3a78]',
  'from-[#fdeae0] to-gold-soft text-[#8a3c10]',
  'from-[#dff0ea] to-[#f3f0da] text-bamboo-deep',
] as const

function tint(id: number): string {
  return TINTS[Math.abs(id) % TINTS.length]
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Fiverr-style provider card: monogram banner, verified badge, rating strip.
 * The whole card is one link — the click target mirrors the visual boundary.
 */
export function ProviderCard({ provider }: { provider: ProviderSummary }): React.ReactElement {
  const verified = provider.verificationStatus === 'VERIFIED'
  const isNew = provider.averageRating == null

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="group block focus-visible:outline-offset-4"
      aria-label={`View ${provider.businessName}`}
    >
      <Card className="card-lift h-full overflow-hidden group-hover:border-bamboo/30">
        {/* Banner with monogram */}
        <div
          className={`flex h-20 items-end justify-between bg-linear-to-br px-4 pb-0 ${tint(provider.id)}`}
          aria-hidden="true"
        >
          <span className="flex size-14 translate-y-3 items-center justify-center rounded-t-lg bg-surface font-display text-lg font-semibold shadow-sm transition-transform duration-500 ease-serbisyo group-hover:scale-[1.06]">
            {initials(provider.businessName) || 'S'}
          </span>
          {verified && (
            <span className="mb-2 flex items-center gap-1 rounded-full bg-surface/80 px-2 py-0.5 text-[11px] font-semibold">
              <ShieldCheck size={12} className="text-bamboo" />
              Verified
            </span>
          )}
        </div>

        <div className="p-4 pt-5">
          <p className="truncate font-semibold text-ink transition-colors duration-300 group-hover:text-bamboo-deep">
            {provider.businessName}
          </p>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted">
            {provider.bio || 'New on Serbisyo — check back soon.'}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <Stars rating={provider.averageRating} count={provider.reviewCount} />
            {isNew && (
              <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-[#8a5a10]">
                New pro
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
