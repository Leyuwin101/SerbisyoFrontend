import { useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { EmptyState, ErrorState, ProviderCardSkeleton } from '@/components/ui'
import { ProviderCard } from '@/components/ProviderCard'
import { useCategories, useProviderSearch } from '@/hooks/useQueries'

const SORTS = [
  { value: 'RATING', label: 'Highest rated' },
  { value: 'DISTANCE', label: 'Nearest' },
  { value: 'PRICE_LOW_TO_HIGH', label: 'Lowest price' },
] as const

/**
 * Discovery page. Filter state lives in the URL so results are shareable and
 * survive refresh. Filters render as a compact chip row, not a heavy sidebar.
 */
export function ProvidersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories } = useCategories()

  const categoryId = searchParams.get('categoryId')
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
  const minRating = searchParams.get('minRating')
  const sort = searchParams.get('sort') ?? 'RATING'
  const page = Number(searchParams.get('page') ?? 0)

  const update = (changes: Record<string, string | null>): void => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    // Any filter change resets pagination.
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const { data, isLoading, isError, refetch } = useProviderSearch({
    categoryId: categoryId ? Number(categoryId) : undefined,
    verifiedOnly: verifiedOnly || undefined,
    minRating: minRating ? Number(minRating) : undefined,
    sort: sort as 'RATING' | 'DISTANCE' | 'PRICE_LOW_TO_HIGH',
    page: Number.isFinite(page) ? page : 0,
    size: 12,
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Find a pro near you
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Compare verified providers by rating, price and distance. Every review comes from a
          completed booking.
        </p>
      </header>

      {/* Filter bar: chips + sort, no heavy sidebar. */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <FilterChip active={verifiedOnly} onClick={() => update({ verifiedOnly: verifiedOnly ? null : 'true' })}>
          <ShieldCheck size={14} className="shrink-0" aria-hidden="true" /> Verified only
        </FilterChip>
        {[4, 4.5].map((r) => (
          <FilterChip
            key={r}
            active={minRating === String(r)}
            onClick={() => update({ minRating: minRating === String(r) ? null : String(r) })}
          >
            ★ {r}+
          </FilterChip>
        ))}
        {categories?.content.map((category) => (
          <FilterChip
            key={category.id}
            active={categoryId === String(category.id)}
            onClick={() =>
              update({ categoryId: categoryId === String(category.id) ? null : String(category.id) })
            }
          >
            {category.name}
          </FilterChip>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="rounded-sm border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-bamboo"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading providers">
          {Array.from({ length: 6 }, (_, i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Could not load providers" onRetry={() => void refetch()} />}
      {data && data.content.length === 0 && (
        <EmptyState
          title="No providers match"
          hint="Try removing a filter or widening your search — new pros join every week."
          action={
            <button
              onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
              className="rounded-sm bg-bamboo px-4 py-2 text-sm font-semibold text-white hover:bg-bamboo-deep"
            >
              Clear filters
            </button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.content.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      {data && data.page.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
          <PagerButton
            label="Previous page"
            disabled={page === 0}
            onClick={() => update({ page: String(Math.max(0, page - 1)) })}
          >
            ← Prev
          </PagerButton>
          <span className="text-sm text-muted">
            Page {page + 1} of {data.page.totalPages}
          </span>
          <PagerButton
            label="Next page"
            disabled={page >= data.page.totalPages - 1}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next →
          </PagerButton>
        </nav>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
        active
          ? 'border-bamboo bg-bamboo text-white'
          : 'border-line bg-surface text-muted hover:border-bamboo/40 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-bamboo/40 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
