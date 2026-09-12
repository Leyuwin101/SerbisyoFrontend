import { useMutation } from '@tanstack/react-query'
import { Card, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { notificationApi } from '@/api'
import { errorMessage } from '@/api/client'
import { useInvalidateHelpers, useNotifications } from '@/hooks/useQueries'

const timeFormat = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function NotificationsPage(): React.ReactElement {
  const { data, isLoading, isError, error, refetch } = useNotifications(true)
  const { invalidateNotifications } = useInvalidateHelpers()

  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: invalidateNotifications,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Notifications</h1>
        <button
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending}
          className="rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-bamboo/40 disabled:opacity-50"
        >
          {markAll.isPending ? 'Marking…' : 'Mark all as read'}
        </button>
      </div>

      {isLoading && <LoadingState rows={3} />}
      {isError && <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />}
      {data && data.content.length === 0 && (
        <EmptyState title="You're all caught up" hint="Booking updates and messages will appear here." />
      )}

      <ul className="space-y-3">
        {data?.content.map((notification) => (
          <li key={notification.id}>
            <Card
              className={`p-5 ${!notification.read ? 'border-l-4 border-l-gold' : 'opacity-80'}`}
            >
              <p className="font-semibold text-ink">{notification.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{notification.body}</p>
              <p className="mt-2 text-xs text-muted">{timeFormat.format(new Date(notification.createdAt))}</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
