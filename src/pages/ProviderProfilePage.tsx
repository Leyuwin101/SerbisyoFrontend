import { Link, useParams } from 'react-router-dom'
import { ShieldCheck, MapPin, ArrowLeft, CalendarDays } from 'lucide-react'
import { useProviderProfile, useProviderReviews } from '@/hooks/useQueries'
import { Badge, Card, EmptyState, ErrorState, LinkButton, LoadingState, Stars } from '@/components/ui'
import { Avatar } from '@/components/Avatar'
import { errorMessage } from '@/api/client'

export function ProviderProfilePage(): React.ReactElement {
  const { id } = useParams()
  const providerId = Number(id)

  const {
    data: provider,
    isLoading,
    isError,
    error,
    refetch,
  } = useProviderProfile(Number.isNaN(providerId) ? null : providerId)

  const {
    data: reviews,
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useProviderReviews(Number.isNaN(providerId) ? null : providerId, 0, 5)

  if (Number.isNaN(providerId)) {
    return <ErrorState message="That provider link looks broken." />
  }

  if (isLoading) return <LoadingState rows={3} />
  if (isError || !provider) {
    return <ErrorState message={errorMessage(error) || 'Could not load this provider.'} onRetry={() => void refetch()} />
  }

  const verified = provider.verificationStatus === 'VERIFIED'

  return (
    <div className="space-y-10">
      <Link
        to="/providers"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" /> All providers
      </Link>

      {/* Profile header — who this person is, one glance. */}
      <header className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={provider.businessName} avatarKey={provider.avatarUrl} size={64} />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  {provider.businessName}
                </h1>
                {verified && (
                  <Badge tone="green">
                    <ShieldCheck size={13} aria-hidden="true" /> Verified
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                <Stars rating={provider.averageRating} count={provider.reviewCount} />
                <span className="flex items-center gap-1 text-sm text-muted">
                  <MapPin size={14} aria-hidden="true" /> Philippines
                </span>
              </div>
            </div>
          </div>
          {provider.bio && (
            <p className="mt-4 max-w-prose leading-relaxed text-muted">{provider.bio}</p>
          )}
        </div>

        {/* Stats strip — the trust numbers, Fiverr-style. */}
        <div className="md:col-span-4">
          <Card className="grid grid-cols-3 divide-x divide-line p-0 text-center">
            <div className="px-2 py-4">
              <p className="font-display text-xl font-semibold text-ink">
                {provider.averageRating != null ? provider.averageRating.toFixed(1) : '—'}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">Rating</p>
            </div>
            <div className="px-2 py-4">
              <p className="font-display text-xl font-semibold text-ink">{provider.reviewCount ?? 0}</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">Reviews</p>
            </div>
            <div className="px-2 py-4">
              <p className="font-display text-xl font-semibold text-bamboo-deep">
                {verified ? 'Yes' : 'New'}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">Verified</p>
            </div>
          </Card>
        </div>
      </header>

      {/* Booking CTA — the next step, always one glance away. */}
      <section className="flex flex-col gap-3 border-y border-line bg-bamboo-soft/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Ready to book with {provider.businessName}?</p>
          <p className="text-sm text-muted">Browse their services and pick a time that works for you.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-sm bg-bamboo px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-bamboo-deep active:scale-[0.98]"
          >
            <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" /> Book a service
          </Link>
          <LinkButton to={`/messages?providerId=${provider.id}`} variant="secondary">
            Message
          </LinkButton>
        </div>
      </section>

      {/* Services owned by a provider are not publicly enumerable through the
          current API, so the profile leads with trust signals instead. */}
      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold text-ink">Reviews</h2>
        {reviewsLoading && <LoadingState rows={2} />}
        {reviewsError && (
          <ErrorState message="Could not load reviews." onRetry={() => void refetchReviews()} />
        )}
        {reviews && reviews.content.length === 0 && (
          <EmptyState title="No reviews yet" hint="Completed bookings will show their reviews here." />
        )}
        <ul className="space-y-3">
          {reviews?.content.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-baseline justify-between gap-4">
                <Stars rating={review.rating} />
                <span className="text-xs text-muted">
                  {new Date(review.createdAt).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{review.comment}</p>
            </Card>
          ))}
        </ul>
      </section>
    </div>
  )
}
