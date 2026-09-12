import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addressApi,
  bookingApi,
  categoryApi,
  conversationApi,
  favoriteApi,
  notificationApi,
  providerApi,
  reviewApi,
  serviceApi,
} from '@/api'

/**
 * Server-state hooks. Each hook documents its cache strategy so pages never
 * call the raw API layer directly (single data-fetching pipeline).
 */

// Categories are stable reference data — long stale time, no polling.
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list(0, 50),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// Services per category — moderately stale, invalidated after mutations.
export function useServicesByCategory(categoryId: number | null) {
  return useQuery({
    queryKey: ['services', 'category', categoryId],
    queryFn: () => serviceApi.byCategory(categoryId!),
    enabled: categoryId !== null,
    staleTime: 2 * 60 * 1000,
  })
}

// Public service browse — short stale time so new listings appear quickly.
export function useServiceBrowse(page = 0, size = 20) {
  return useQuery({
    queryKey: ['services', 'browse', page, size],
    queryFn: () => serviceApi.browse(page, size),
    staleTime: 60 * 1000,
  })
}

// Public service search — dynamic query, short stale time, single retry.
export function useServiceSearch(q: string | null, page = 0, size = 20) {
  return useQuery({
    queryKey: ['services', 'search', q, page, size],
    queryFn: () => serviceApi.search(q!, page, size),
    enabled: q !== null && q.trim().length > 0,
    staleTime: 30 * 1000,
    retry: 1,
  })
}

// Provider search results are dynamic — short stale time, no retry storms.
export function useProviderSearch(
  params: Parameters<typeof providerApi.search>[0] & { enabled?: boolean },
) {
  const { enabled = true, ...search } = params
  return useQuery({
    queryKey: ['providers', 'search', search],
    queryFn: () => providerApi.search(search),
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  })
}

// Provider profile — public, cached for a few minutes.
export function useProviderProfile(providerId: number | null) {
  return useQuery({
    queryKey: ['providers', providerId],
    queryFn: () => providerApi.get(providerId!),
    enabled: providerId !== null,
    staleTime: 5 * 60 * 1000,
  })
}

// Unread notification count — polled lightly while authenticated.
export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.unreadCount,
    enabled,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })
}

// Notification inbox.
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApi.list(),
    enabled,
    staleTime: 30 * 1000,
  })
}

/** Invalidate everything affected after a mutation. */
export function useInvalidateHelpers() {
  const queryClient = useQueryClient()
  return {
    invalidateNotifications: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    invalidateProviders: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
    invalidateBookings: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  }
}

// ---------- bookings ----------
export function useBookings(enabled: boolean, page = 0, size = 20, status?: string) {
  return useQuery({
    queryKey: ['bookings', 'list', page, size, status ?? null],
    queryFn: () => bookingApi.list(page, size, status),
    enabled,
    staleTime: 15 * 1000,
  })
}

export function useBooking(id: number | null, enabled = true) {
  return useQuery({
    queryKey: ['bookings', 'detail', id],
    queryFn: () => bookingApi.get(id!),
    enabled: enabled && id !== null,
    staleTime: 15 * 1000,
  })
}

// ---------- reviews ----------
// Reviews are effectively immutable once written — long stale time, no retries.
export function useProviderReviews(providerId: number | null, page = 0, size = 10) {
  return useQuery({
    queryKey: ['reviews', 'provider', providerId, page, size],
    queryFn: () => reviewApi.byProvider(providerId!, page, size),
    enabled: providerId !== null,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useMyReviews(enabled: boolean) {
  return useQuery({
    queryKey: ['reviews', 'me'],
    queryFn: () => reviewApi.mine(),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

// ---------- favorites ----------
// Enabled only while authenticated; disabled when logged out to avoid 401 noise.
export function useFavorites(enabled: boolean) {
  return useQuery({
    queryKey: ['favorites', 'list'],
    queryFn: () => favoriteApi.list(),
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

// ---------- messaging ----------
export function useConversations(enabled: boolean) {
  return useQuery({
    queryKey: ['conversations', 'list'],
    queryFn: () => conversationApi.list(),
    enabled,
    // Conversations change as messages arrive — poll lightly while visible.
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  })
}

export function useMessages(conversationId: number | null, enabled = true) {
  return useQuery({
    queryKey: ['conversations', 'messages', conversationId],
    queryFn: () => conversationApi.messages(conversationId!, 0, 100),
    enabled: enabled && conversationId !== null,
    // New messages should appear quickly while the thread is open.
    refetchInterval: 10 * 1000,
    staleTime: 5 * 1000,
  })
}

// ---------- addresses ----------
export function useAddresses(enabled: boolean) {
  return useQuery({
    queryKey: ['addresses', 'list'],
    queryFn: () => addressApi.list(),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

// ---------- single service ----------
export function useService(id: number | null) {
  return useQuery({
    queryKey: ['services', 'detail', id],
    queryFn: () => serviceApi.get(id!),
    enabled: id !== null,
    staleTime: 2 * 60 * 1000,
  })
}
