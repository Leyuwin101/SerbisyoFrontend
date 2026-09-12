import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/**
 * Route protection is UX only — the backend enforces authorization for real.
 * Unauthenticated visitors are redirected to /login, preserving the intended
 * destination so they land there after signing in.
 */
export function RequireAuth(): React.ReactElement {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
