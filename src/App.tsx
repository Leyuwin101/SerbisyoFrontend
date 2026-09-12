import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthProvider } from '@/hooks/useAuth'
import { RequireAuth } from '@/hooks/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HomePage } from '@/pages/HomePage'
import { ProvidersPage } from '@/pages/ProvidersPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { BookingsPage } from '@/pages/BookingsPage'
import { AddressesPage } from '@/pages/AddressesPage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { MessagesPage } from '@/pages/MessagesPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Route-level code splitting for pages a visitor only opens on demand.
const ProviderProfilePage = lazy(async () => ({ default: (await import('@/pages/ProviderProfilePage')).ProviderProfilePage }))
const ServiceDetailPage = lazy(async () => ({ default: (await import('@/pages/ServiceDetailPage')).ServiceDetailPage }))

// Query client defaults favour cached data and avoid retry storms.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route
                path="services/:id"
                element={
                  <Suspense fallback={null}>
                    <ServiceDetailPage />
                  </Suspense>
                }
              />
              <Route path="providers" element={<ProvidersPage />} />
              <Route
                path="providers/:id"
                element={
                  <Suspense fallback={null}>
                    <ProviderProfilePage />
                  </Suspense>
                }
              />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route element={<RequireAuth />}>
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="addresses" element={<AddressesPage />} />
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="messages" element={<MessagesPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
