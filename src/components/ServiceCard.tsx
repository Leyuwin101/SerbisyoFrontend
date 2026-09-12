import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Stars } from '@/components/ui'
import { avatarUrl } from '@/api'
import type { ProviderSummary, ServiceSummary } from '@/types'
import { formatPrice } from '@/utils/format'

/**
 * Marketplace service card — the same card everywhere services are listed.
 * Banner shows the provider's photo when available, a monogram otherwise.
 * Pass `provider` when the listing context already has it (homepage joins);
 * without it the card still renders, just without the provider row.
 */
export function ServiceCard({
  service,
  provider,
}: {
  service: ServiceSummary
  provider?: ProviderSummary
}): React.ReactElement {
  return (
    <Link
      to={`/services/${service.id}`}
      className="group block h-full focus-visible:outline-offset-4"
      aria-label={`${service.name} — from ${formatPrice(service.basePrice)}`}
    >
      <div className="card-lift flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface group-hover:border-bamboo/30">
        {/* Banner: warm monogram tile, echoes the provider-card identity. */}
        <div className="flex h-28 items-center justify-center bg-bamboo-soft" aria-hidden="true">
          {provider?.avatarUrl ? (
            <img
              src={avatarUrl(provider.avatarUrl) ?? ''}
              alt=""
              loading="lazy"
              className="size-20 rounded-full border-2 border-surface object-cover shadow-sm"
            />
          ) : (
            <span className="font-display text-2xl font-semibold text-bamboo-deep/70">
              {service.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          {provider && (
            <p className="flex items-center gap-1 text-xs font-semibold text-muted">
              <span className="truncate">{provider.businessName}</span>
              {provider.verificationStatus === 'VERIFIED' && (
                <ShieldCheck size={12} className="shrink-0 text-bamboo" aria-label="Verified provider" />
              )}
            </p>
          )}
          <p className="mt-1 line-clamp-2 font-semibold leading-snug text-ink transition-colors duration-300 group-hover:text-bamboo-deep">
            {service.name}
          </p>
          {service.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{service.description}</p>
          )}

          <div className="flex items-end justify-between gap-2 border-t border-line pt-3 [margin-top:auto]">
            <div>
              {provider && <Stars rating={provider.averageRating} count={provider.reviewCount} />}
              <p className="mt-0.5 text-sm text-muted">
                From <span className="font-display text-base font-semibold text-ink">{formatPrice(service.basePrice)}</span>
              </p>
            </div>
            <span className="rounded-full bg-bamboo-soft px-2 py-0.5 text-xs font-semibold text-bamboo-deep">
              {service.pricingType.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
