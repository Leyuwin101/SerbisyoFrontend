import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, EmptyState, ErrorState, LoadingState, Badge, statusTone } from '@/components/ui'
import { bookingApi } from '@/api'
import { errorMessage } from '@/api/client'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/**
 * The current user's bookings. Loading / empty / error states are explicit;
 * status is tone-coded consistently with every other screen.
 */
export function BookingsPage(): React.ReactElement {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookings', 'list', status],
    queryFn: () => bookingApi.list(0, 20, status),
    staleTime: 30_000,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">My bookings</h1>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>Status</span>
          <select
            value={status ?? ''}
            onChange={(e) => setStatus(e.target.value === '' ? undefined : e.target.value)}
            className="rounded-sm border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-bamboo"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <LoadingState rows={3} />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />}
      {data && data.content.length === 0 && (
        <EmptyState
          title="No bookings yet"
          hint="When you book a provider, it shows up here with its live status."
          action={
            <Link
              to="/services"
              className="rounded-sm bg-bamboo px-4 py-2 text-sm font-semibold text-white hover:bg-bamboo-deep"
            >
              Find a pro
            </Link>
          }
        />
      )}

      <ul className="space-y-3">
        {data?.content.map((booking) => (
          <li key={booking.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-ink">Booking #{booking.id}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {dateFormat.format(new Date(booking.scheduledStart))}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-display text-lg font-semibold text-ink">
                  ₱{Number(booking.quotedAmount).toLocaleString('en-PH')}
                </p>
                <Badge tone={statusTone(booking.status)}>
                  {booking.status.replaceAll('_', ' ').toLowerCase()}
                </Badge>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
