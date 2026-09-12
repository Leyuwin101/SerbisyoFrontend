import { api } from './client'
import { tokenStore } from './client'

export { tokenStore, api }
import type {
  Address,
  AuthResponse,
  BookingSummary,
  CreateBookingRequest,
  CreateReviewRequest,
  FavoriteProvider,
  ConversationSummary,
  LoginRequest,
  Message,
  NotificationDto,
  PageResponse,
  ProviderSummary,
  RegisterRequest,
  ReviewSummary,
  ServiceCategory,
  ServiceSummary,
  UserSummary,
  MyProfile,
} from '@/types'
import type { AxiosResponse } from 'axios'

// Backend returns Spring's Page object ({content, totalElements, ...}).
// Normalise it (and the nested PageMetadataDto variant) to PageResponse<T>.
export function normalisePage<T>(data: unknown): PageResponse<T> {
  const page = data as {
    content?: T[]
    totalElements?: number
    number?: number
    size?: number
    totalPages?: number
    page?: { page: number; size: number; totalElements: number; totalPages: number }
  }
  if (page?.page) {
    return {
      content: page.content ?? [],
      page: {
        page: page.page.page,
        size: page.page.size,
        totalElements: page.page.totalElements,
        totalPages: page.page.totalPages,
      },
    }
  }
  return {
    content: page?.content ?? [],
    page: {
      page: page?.page?.page ?? page?.number ?? 0,
      size: page?.page?.size ?? page?.size ?? (page?.content?.length ?? 0),
      totalElements: page?.page?.totalElements ?? page?.totalElements ?? (page?.content?.length ?? 0),
      totalPages: page?.page?.totalPages ?? page?.totalPages ?? 1,
    },
  }
}

export const unwrap = <T>(response: AxiosResponse<T>): T => response.data

// ---------- self-service profile ----------
export const userApi = {
  me: () => api.get<UserSummary>('/users/me').then(unwrap),
  update: (body: { email?: string; phone?: string }) =>
    api.patch<{ user: UserSummary }>('/users/me', body).then((r) => r.data.user),
  /** One-shot hydration: account + role profile(s) in a single request. */
  myProfile: () => api.get<MyProfile>('/users/me/profile').then(unwrap),
  /** Update the customer profile (display name). Returns the updated profile. */
  updateCustomerProfile: (body: { displayName?: string }) =>
    api
      .put<{ customer: { id: number; userId: number; displayName: string; avatarUrl: string | null } }>(
        '/users/me/customer-profile',
        body,
      )
      .then((r) => r.data.customer),
  /** Upload a profile photo; attaches to the customer or provider profile. */
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

/** Public URL for an avatar storage key. */
export const avatarUrl = (key: string | null | undefined): string | null =>
  key ? `/api/v1/files/${key}` : null

// ---------- auth ----------
export const authApi = {
  login: (body: LoginRequest) => api.post<AuthResponse>('/auth/login', body).then(unwrap),
  register: (body: RegisterRequest) => api.post<AuthResponse>('/auth/register', body).then(unwrap),
  logout: () => api.post('/auth/logout', { token: tokenStore.refresh }).then(() => tokenStore.clear()),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', body).then(unwrap),
}

// ---------- catalog ----------
export const categoryApi = {
  list: (page = 0, size = 50) =>
    api
      .get('/categories', { params: { page, size } })
      .then((r) => normalisePage<ServiceCategory>(r.data)),
}

export const serviceApi = {
  /** Public browse of all active services. */
  browse: (page = 0, size = 20) =>
    api
      .get('/services', { params: { page, size } })
      .then((r) => normalisePage<ServiceSummary>(r.data)),
  /** Public search by title keyword (`q`). */
  search: (q: string, page = 0, size = 20) =>
    api
      .get('/services/search', { params: { q, page, size } })
      .then((r) => normalisePage<ServiceSummary>(r.data)),
  byCategory: (categoryId: number, page = 0, size = 20) =>
    api
      .get(`/categories/${categoryId}/services`, { params: { page, size } })
      .then((r) => normalisePage<ServiceSummary>(r.data)),
  get: (id: number) => api.get<ServiceSummary>(`/services/${id}`).then(unwrap),
}

// ---------- providers ----------
export const providerApi = {
  search: (params: {
    categoryId?: number
    minRating?: number
    minPrice?: number
    maxPrice?: number
    latitude?: number
    longitude?: number
    verifiedOnly?: boolean
    sort?: 'RATING' | 'DISTANCE' | 'PRICE_LOW_TO_HIGH'
    page?: number
    size?: number
  }) =>
    api
      .get('/providers/search', { params })
      .then((r) => normalisePage<ProviderSummary>(r.data)),
  get: (id: number) => api.get<ProviderSummary>(`/providers/${id}`).then(unwrap),
  me: () => api.get<ProviderSummary>('/providers/me').then(unwrap),
  updateProfile: (body: { businessName?: string; bio?: string }) =>
    api
      .put<{ provider: ProviderSummary }>('/providers/me', body)
      .then((r) => r.data.provider),
}

// ---------- notifications ----------
export const notificationApi = {
  list: (page = 0, size = 20) =>
    api
      .get('/notifications', { params: { page, size } })
      .then((r) => normalisePage<NotificationDto>(r.data)),
  unreadCount: () => api.get<number>('/notifications/unread/count').then(unwrap),
  markAllRead: () => api.post('/notifications/read-all'),
}

// ---------- bookings ----------
export const bookingApi = {
  list: (page = 0, size = 20, status?: string) =>
    api
      .get('/bookings', { params: { page, size, status } })
      .then((r) => normalisePage<BookingSummary>(r.data)),
  get: (id: number) => api.get<BookingSummary>(`/bookings/${id}`).then(unwrap),
  create: (body: CreateBookingRequest) => api.post('/bookings', body).then(unwrap),
  update: (id: number, body: { scheduledStart?: string; scheduledEnd?: string; addressId?: number; customerNote?: string }) =>
    api.patch(`/bookings/${id}`, body).then(unwrap),
  cancel: (id: number, reason?: string) =>
    api.post(`/bookings/${id}/cancel`, null, { params: reason ? { reason } : {} }).then(unwrap),
}

// ---------- reviews ----------
export const reviewApi = {
  byProvider: (providerId: number, page = 0, size = 10) =>
    api
      .get(`/reviews/provider/${providerId}`, { params: { page, size } })
      .then((r) => normalisePage<ReviewSummary>(r.data)),
  mine: (page = 0, size = 20) =>
    api.get('/reviews/me', { params: { page, size } }).then((r) => normalisePage<ReviewSummary>(r.data)),
  create: (body: CreateReviewRequest) => api.post('/reviews', body).then(unwrap),
}

// ---------- favorites ----------
export const favoriteApi = {
  list: (page = 0, size = 20) =>
    api
      .get('/favorites', { params: { page, size } })
      .then((r) => normalisePage<FavoriteProvider>(r.data)),
  add: (providerId: number) => api.post('/favorites', { providerId }).then(unwrap),
  remove: (providerId: number) => api.delete(`/favorites/${providerId}`),
}

// ---------- messaging ----------
export const conversationApi = {
  list: (page = 0, size = 20) =>
    api.get('/conversations', { params: { page, size } }).then((r) => normalisePage<ConversationSummary>(r.data)),
  messages: (conversationId: number, page = 0, size = 50) =>
    api
      .get(`/conversations/${conversationId}/messages`, { params: { page, size } })
      .then((r) => normalisePage<Message>(r.data)),
  send: (conversationId: number, content: string) =>
    api.post(`/conversations/${conversationId}/messages`, { content }).then(unwrap),
  open: (body: { providerId: number; bookingId?: number }) =>
    api.post('/conversations', body).then(unwrap),
  markRead: (conversationId: number) =>
    api.post('/conversations/messages/read', { conversationId }).then(unwrap),
}

// ---------- addresses ----------
// Backend contract: POST /addresses body is CreateAddressRequest
// {label, addressLine, locality, city, region, postalCode, country, latitude, longitude}.
export interface CreateAddressBody {
  label: string
  addressLine: string
  locality?: string
  city: string
  region: string
  postalCode: string
  country: string
  latitude: number
  longitude: number
}

export const addressApi = {
  list: (page = 0, size = 20) =>
    api.get('/addresses', { params: { page, size } }).then((r) => normalisePage<Address>(r.data)),
  create: (body: CreateAddressBody) => api.post('/addresses', body).then(unwrap),
  update: (id: number, body: Partial<CreateAddressBody>) =>
    api.put(`/addresses/${id}`, body).then(unwrap),
  remove: (id: number) => api.delete(`/addresses/${id}`),
}
