import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, EmptyState, ErrorState, ProviderCardSkeleton } from '@/components/ui'
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

  const clearSearch = (): void => {
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {searching ? `Results for “${query}”` : 'Explore services'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {searching ? 'Matching services from verified pros across Serbisyo.' : 'Everyday pros, transparent pricing, booked in minutes.'}
        </p>
        {searching && (
          <button
            onClick={clearSearch}
            className="mt-3 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-bamboo transition-colors duration-300 hover:border-bamboo/40"
          >
            Clear search
          </button>
        )}
      </div>

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
            <Link to={`/services/${s.id}`} className="group block h-full">
              <Card className="flex h-full flex-col p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-bamboo/40 group-hover:shadow-lg group-hover:shadow-bamboo/5">
                <p className="font-semibold text-ink">{s.name}</p>
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>}
                <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                  <span className="font-display text-lg font-semibold text-ink">{formatPrice(s.basePrice)}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {s.pricingType.toLowerCase()}
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        selected ? 'border-bamboo bg-bamboo text-white' : 'border-line bg-surface text-muted hover:border-bamboo/40'
      }`}
    >
      {children}
    </button>
  )
}
