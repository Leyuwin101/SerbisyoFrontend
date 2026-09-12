import { useMutation } from '@tanstack/react-query'
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui'
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
      <PageHeader
        title="Notifications"
        subtitle="Booking updates, messages and account activity."
        actions={
          <Button variant="secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            {markAll.isPending ? 'Marking…' : 'Mark all as read'}
          </Button>
        }
      />

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
