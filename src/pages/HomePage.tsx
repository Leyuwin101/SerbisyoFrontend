import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, CalendarCheck, MessageSquare } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState, ProviderCardSkeleton } from '@/components/ui'
import { ProviderCard } from '@/components/ProviderCard'
import { useCategories, useProviderSearch } from '@/hooks/useQueries'

/**
 * Landing page: an editorial hero, category browse grid (long-cached reference
 * data) and a preview of top-rated providers. Only summary DTOs are consumed.
 */
export function HomePage(): React.ReactElement {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { data: categories, isLoading, isError, refetch } = useCategories()
  const { data: topProviders, isLoading: providersLoading } = useProviderSearch({
    sort: 'RATING',
    size: 6,
  })

  const submitSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    navigate(query.trim() ? `/services?q=${encodeURIComponent(query.trim())}` : '/services')
  }

  return (
    <div className="space-y-16">
      {/* Hero — double-bezel shell around a centered search-first panel. */}
      <section className="rounded-2xl border border-line bg-bamboo-soft/50 p-1.5 sm:p-2">
        <div className="relative overflow-hidden rounded-xl border border-line/70 bg-surface px-6 py-14 sm:px-10 sm:py-16">
        {/* Warm accent corner, kept subtle to stay on-brand. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-gold-soft blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-bamboo-soft blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="rise-in font-display text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Find someone who can actually get it done.
          </h1>
          <p className="rise-in rise-in-1 mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted">
            Serbisyo connects you with verified local professionals — from plumbers to tutors —
            with real ratings, upfront pricing and bookings you can actually rely on.
          </p>
          {/* Search — the primary action, Fiverr-style. */}
          <form
            onSubmit={submitSearch}
            className="rise-in rise-in-2 mx-auto mt-8 flex max-w-xl items-stretch rounded-full border border-ink/15 bg-white p-1.5 shadow-[0_2px_8px_rgba(26,32,28,0.08),0_1px_2px_rgba(26,32,28,0.06)] transition-colors duration-300 focus-within:border-bamboo/60 focus-within:shadow-[0_4px_16px_rgba(23,73,59,0.12)]"
            role="search"
          >
            <label htmlFor="hero-search" className="sr-only">Search for services</label>
            <div className="flex flex-1 items-center gap-2.5 px-4">
              <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
              <input
                id="hero-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What service do you need? e.g. plumber, tutor…"
                className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-muted/60"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-bamboo px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-bamboo-deep active:scale-[0.97]"
            >
              Search
            </button>
          </form>
          {/* Popular shortcuts. */}
          {categories && categories.content.length > 0 && (
            <div className="rise-in rise-in-3 mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted">Popular:</span>
              {categories.content.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  to={`/providers?categoryId=${category.id}`}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink transition-colors duration-300 hover:border-bamboo/40 hover:text-bamboo-deep"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
          <p className="mt-7 flex items-center justify-center gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="text-bamboo" aria-hidden="true" />
            Every provider is verified before they can accept bookings.
          </p>
        </div>
        </div>
      </section>

      {/* How it works — three honest steps, no fluff. */}
      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
          How Serbisyo works
        </h2>
        <ol className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          <Step
            icon={<Search size={20} strokeWidth={1.75} />}
            step="1"
            title="Search & compare"
            detail="Browse verified pros by category, rating and price. Reviews come only from real bookings."
          />
          <Step
            icon={<CalendarCheck size={20} strokeWidth={1.75} />}
            step="2"
            title="Book in minutes"
            detail="Pick a service, choose a time that works and confirm — pricing is upfront, no surprises."
          />
          <Step
            icon={<MessageSquare size={20} strokeWidth={1.75} />}
            step="3"
            title="Chat & get it done"
            detail="Message your pro, track the booking, and pay securely once the job is complete."
          />
        </ol>
      </section>

      {/* Categories — flat editorial grid, links carry the navigation. */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Browse by category</h2>
          <Link to="/providers" className="text-sm font-semibold text-bamboo hover:underline">
            See everything
          </Link>
        </div>
        {isLoading && <LoadingState rows={2} />}
        {isError && <ErrorState message="Could not load categories" onRetry={() => void refetch()} />}
        {categories && categories.content.length === 0 && (
          <EmptyState
            title="No categories yet"
            hint="Categories appear once the Serbisyo team adds them."
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories?.content.map((category) => (
            <Link
              key={category.id}
              to={`/providers?categoryId=${category.id}`}
              className="group rounded-lg border border-line bg-surface p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-bamboo/30 hover:bg-bamboo-soft/40 hover:shadow-[0_12px_32px_-12px_rgba(23,73,59,0.18)]"
            >
              <p className="font-semibold text-ink transition-colors duration-300 group-hover:text-bamboo-deep">{category.name}</p>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Top providers — one honest preview of the marketplace. */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Top-rated pros</h2>
          <Link to="/providers" className="text-sm font-semibold text-bamboo hover:underline">
            See all providers
          </Link>
        </div>
        {providersLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading providers">
            {Array.from({ length: 3 }, (_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        )}
        {topProviders && topProviders.content.length === 0 && (
          <EmptyState title="No providers yet" hint="Be the first to offer your services on Serbisyo." />
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topProviders?.content.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Step({
  icon,
  step,
  title,
  detail,
}: {
  icon: React.ReactNode
  step: string
  title: string
  detail: string
}): React.ReactElement {
  return (
    <li className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-bamboo-soft text-bamboo"
        >
          {icon}
        </span>
        <p className="text-xs font-semibold tracking-wide text-muted">Step {step}</p>
      </div>
      <p className="mt-3 font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{detail}</p>
    </li>
  )
}
