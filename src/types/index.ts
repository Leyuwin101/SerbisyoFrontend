// Shared API types mirroring the backend DTOs (summary shapes only).
// Never widen these to `any`; they are the contract with the backend.

export type Role = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'MODERATOR' | 'SUPPORT'
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROVIDER_ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
export type PricingType = 'FIXED' | 'HOURLY' | 'QOUTE'

export interface UserSummary {
  id: number
  email: string
  phone: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  /** Role lives in the JWT claims; the summary DTO may omit it. */
  role?: Role
  /** Flattened from the role profile by the auth layer for display. */
  displayName?: string | null
  avatarUrl?: string | null
}

export interface CustomerProfileSummary {
  id: number
  userId: number
  displayName: string
  avatarUrl: string | null
}

export interface MyProfile {
  user: UserSummary
  customer: CustomerProfileSummary | null
  provider: ProviderSummary | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserSummary
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  /** Must exactly match {@link password}; the backend validates this. */
  confirmPassword: string
  phone: string
  roles?: ('CUSTOMER' | 'PROVIDER')[]
}

export interface PageMetadata {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PageResponse<T> {
  content: T[]
  page: PageMetadata
}

export interface ServiceCategory {
  id: number
  name: string
  description: string | null
  active: boolean
}

export interface ProviderSummary {
  id: number
  userId: number
  businessName: string
  bio: string | null
  verificationStatus: string | null
  averageRating: number | null
  reviewCount: number | null
  avatarUrl?: string | null
}

export interface ServiceSummary {
  id: number
  providerId: number
  categoryId: number
  name: string
  description: string | null
  pricingType: PricingType
  basePrice: string
  durationMinutes: number | null
  active: boolean
}

export interface ReviewSummary {
  id: number
  bookingId: number
  customerId: number
  providerId: number
  rating: number
  comment: string
  createdAt: string
}

export interface ConversationSummary {
  id: number
  customerId: number
  providerId: number
  bookingId: number
  lastMessage: string | null
  lastMessageAt: string | null
  otherParticipant: string
  unreadCount: number
}

export interface Message {
  id: number
  conversationId: number
  senderId: number
  content: string
  readAt: string | null
  attachmentReference: string | null
  createdAt: string
  /** Client-side flag: true when the sender is the signed-in user. */
  sentByMe?: boolean
}

export interface Payment {
  id: number
  bookingId: number
  amount: string
  currency: string
  status: string
  method: string
  providerReference: string | null
  createdAt: string
  updatedAt: string | null
}

export interface Dispute {
  id: number
  bookingId: number
  openedBy: number
  reason: string
  status: string
  resolution: string | null
  resolvedBy: number | null
  createdAt: string
  resolvedAt: string | null
}

export interface Address {
  id: number
  label: string | null
  /** Backend DTO field name: `addressLine` (not `street`). */
  addressLine: string | null
  locality: string | null
  city: string | null
  /** Backend DTO field name: `region` (not `province`). */
  region: string | null
  postalCode: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

export interface CreateBookingRequest {
  providerId: number
  serviceId: number
  addressId: number
  /** ISO offset date-time; must be in the future (validated server-side). */
  scheduledStart: string
  /** ISO offset date-time; must be after start and within 24h of it. */
  scheduledEnd: string
  customerNote?: string
  /** Line items: server re-prices them from the trusted Service record. */
  items?: { serviceId: number; quantity: number }[]
}

export interface CreateReviewRequest {
  bookingId: number
  /** 1-5 stars; providerId is derived from the booking server-side. */
  rating: number
  comment?: string
}

export interface NotificationDto {
  id: number
  userId: number
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface BookingSummary {
  id: number
  customerId: number
  providerId: number
  serviceId: number
  status: BookingStatus
  scheduledStart: string
  scheduledEnd: string
  quotedAmount: number
}

export interface FavoriteProvider {
  id: number
  customerId: number
  providerId: number
  provider: ProviderSummary
}

export interface ApiErrorBody {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
  fieldErrors?: Record<string, string>
}
