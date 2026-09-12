import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Chip, EmptyState, ErrorState, PageHeader, ProviderCardSkeleton } from '@/components/ui'
import { useCategories, useServiceBrowse, useServiceSearch, useServicesByCategory } from '@/hooks/useQueries'
import { errorMessage } from '@/api/client'
import { formatPrice } from '@/utils/format'

const PAGE_SIZE = 20

/**
 * Explore services. Category chips drive the query; the list is
 * server-paginated so the browser never filters unbounded data.
 * A text query (?q=) from the hero search switches to server search mode.
 */
export function ServicesPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const categories = useCategories()
  const byCategory = useServicesByCategory(categoryId)
  const browse = useServiceBrowse(0, PAGE_SIZE)
  const search = useServiceSearch(query, 0, PAGE_SIZE)

  const searching = query !== null && query.trim().length > 0
  const active = searching ? search : categoryId !== null ? byCategory : browse
  const services = active.data?.content ?? []
  const totalResults = active.data?.page.totalElements ?? services.length

  const clearSearch = (): void => {
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={searching ? `Results for “${query}”` : 'Explore services'}
        subtitle={
          searching
            ? 'Matching services from verified pros across Serbisyo.'
            : 'Everyday pros, transparent pricing, booked in minutes.'
        }
        actions={
          searching ? (
            <button
              onClick={clearSearch}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-bamboo transition-colors duration-300 hover:border-bamboo/40"
            >
              Clear search
            </button>
          ) : undefined
        }
      />
      {!active.isLoading && !active.isError && (
        <p aria-live="polite" className="-mt-2 text-sm text-muted">
          {totalResults} {totalResults === 1 ? 'service' : 'services'}
        </p>
      )}

      {!searching && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <Chip selected={categoryId === null} onClick={() => setCategoryId(null)}>
            All
          </Chip>
          {categories.data?.content.map((c) => (
            <Chip key={c.id} selected={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      {active.isLoading && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading services">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <ProviderCardSkeleton />
            </li>
          ))}
        </ul>
      )}
      {active.isError && <ErrorState message={errorMessage(active.error)} onRetry={() => void active.refetch()} />}
      {!active.isLoading && !active.isError && services.length === 0 && (
        <EmptyState title="No services found" hint="Try another category — new pros join every week." />
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <li key={s.id}>
            <Link
              to={`/services/${s.id}`}
              className="group block h-full rounded-lg border border-line bg-surface p-5 transition-all duration-300 ease-serbisyo hover:-translate-y-1 hover:border-bamboo/40 hover:shadow-lg hover:shadow-bamboo/5 focus-visible:outline-offset-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink transition-colors group-hover:text-bamboo-deep">{s.name}</p>
                {s.durationMinutes != null && (
                  <span className="shrink-0 text-xs font-medium text-muted">~{s.durationMinutes} min</span>
                )}
              </div>
              {s.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{s.description}</p>}
              <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
                <span className="font-display text-lg font-semibold text-ink">{formatPrice(s.basePrice)}</span>
                <span className="rounded-full bg-bamboo-soft px-2 py-0.5 text-xs font-semibold text-bamboo-deep">
                  {s.pricingType.toLowerCase()}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

