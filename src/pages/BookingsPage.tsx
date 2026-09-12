import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, EmptyState, ErrorState, LoadingState, Badge, PageHeader, statusTone } from '@/components/ui'
import { bookingApi } from '@/api'
import { errorMessage } from '@/api/client'
import type { BookingSummary } from '@/types'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** Cancellable while the pro hasn't started work — matches the backend rules. */
function cancellable(status: BookingSummary['status']): boolean {
  return ['PENDING', 'CONFIRMED', 'PROVIDER_ON_THE_WAY'].includes(status)
}

/**
 * The current user's bookings. Loading / empty / error states are explicit;
 * status is tone-coded consistently with every other screen.
 */
export function BookingsPage(): React.ReactElement {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookings', 'list', status],
    queryFn: () => bookingApi.list(0, 20, status),
    staleTime: 30_000,
  })

  const cancel = useMutation({
    mutationFn: (id: number) => bookingApi.cancel(id, 'Cancelled by customer'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="My bookings" subtitle="Track every job from request to completion." />

      {/* Status tabs — one tap to see what's active, no dropdown hunting. */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Chip selected={status === undefined} onClick={() => setStatus(undefined)}>
          All
        </Chip>
        {STATUS_OPTIONS.map((s) => (
          <Chip key={s} selected={status === s} onClick={() => setStatus(status === s ? undefined : s)}>
            {s.replaceAll('_', ' ').toLowerCase()}
          </Chip>
        ))}
      </div>

      {isLoading && <LoadingState rows={3} />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />}
      {data && data.content.length === 0 && (
        <EmptyState
          title={status ? 'Nothing with this status' : 'No bookings yet'}
          hint={status ? 'Try another tab, or book a new service.' : 'When you book a provider, it shows up here with its live status.'}
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
        {data?.content.map((booking) => {
          const cancelling = cancel.isPending && cancel.variables === booking.id
          return (
            <li key={booking.id}>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border border-line bg-surface p-5">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-ink">Booking #{booking.id}</p>
                    <Badge tone={statusTone(booking.status)}>
                      {booking.status.replaceAll('_', ' ').toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {dateFormat.format(new Date(booking.scheduledStart))} → {dateFormat.format(new Date(booking.scheduledEnd))}
                  </p>
                  {cancel.isError && (
                    <p role="alert" className="mt-2 text-sm font-medium text-red-700">
                      {errorMessage(cancel.error)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-display text-lg font-semibold text-ink">
                    ₱{Number(booking.quotedAmount).toLocaleString('en-PH')}
                  </p>
                  {cancellable(booking.status) && (
                    <button
                      onClick={() => cancel.mutate(booking.id)}
                      disabled={cancel.isPending}
                      className="rounded-sm border border-line px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
