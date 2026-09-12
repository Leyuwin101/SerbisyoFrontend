import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, EmptyState, ErrorState, LoadingState, Stars } from '@/components/ui'
import { favoriteApi } from '@/api'
import { errorMessage } from '@/api/client'

/** Saved providers ("favorites"); the list is scoped to the current user. */
export function FavoritesPage(): React.ReactElement {
  const queryClient = useQueryClient()
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: () => favoriteApi.list(0, 50) })

  const remove = useMutation({
    mutationFn: (providerId: number) => favoriteApi.remove(providerId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Favorites</h1>
        <p className="mt-2 text-sm text-muted">Pros you trust, one tap away.</p>
      </div>

      {favorites.isLoading && <LoadingState rows={3} />}
      {favorites.isError && <ErrorState message={errorMessage(favorites.error)} onRetry={() => void favorites.refetch()} />}
      {favorites.data && favorites.data.content.length === 0 && (
        <EmptyState
          title="No favorites yet"
          hint="Tap the heart on a provider to keep them handy."
          action={
            <Link
              to="/providers"
              className="rounded-sm bg-bamboo px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-bamboo-deep"
            >
              Find a pro
            </Link>
          }
        />
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {favorites.data?.content.map((f) => (
          <li key={f.id}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/providers/${f.providerId}`} className="font-semibold text-ink hover:text-bamboo">
                    {f.provider.businessName}
                  </Link>
                  <div className="mt-1">
                    <Stars rating={f.provider.averageRating} count={f.provider.reviewCount} />
                  </div>
                </div>
                <button
                  onClick={() => remove.mutate(f.providerId)}
                  disabled={remove.isPending}
                  className="text-xs font-semibold text-red-700 transition-colors hover:text-red-900 disabled:opacity-50"
                  aria-label={`Remove ${f.provider.businessName} from favorites`}
                >
                  Remove
                </button>
              </div>
              {f.provider.bio && <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{f.provider.bio}</p>}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
