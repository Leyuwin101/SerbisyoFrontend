import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, authApi, tokenStore, userApi } from '@/api'
import { errorMessage } from '@/api/client'
import type { AuthResponse, LoginRequest, MyProfile, RegisterRequest, UserSummary } from '@/types'

interface AuthContextValue {
  user: UserSummary | null
  isAuthenticated: boolean
  login: (body: LoginRequest) => Promise<void>
  register: (body: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  /** Replace the signed-in user record after a profile update. */
  setUser: (user: UserSummary) => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function hydrate(response: AuthResponse): UserSummary {
  tokenStore.set(response.accessToken, response.refreshToken)
  return response.user
}

/**
 * Merge the role profile (display name, avatar) into the signed-in user so the
 * header, messages and profile screens can greet people by name. The request
 * is best-effort: an auth-only user still works with the raw summary.
 */
export async function enrichUser(user: UserSummary): Promise<UserSummary> {
  try {
    const profile: MyProfile = await userApi.myProfile()
    return {
      ...user,
      displayName: profile.customer?.displayName ?? user.displayName ?? null,
      avatarUrl: profile.customer?.avatarUrl ?? profile.provider?.avatarUrl ?? user.avatarUrl ?? null,
    }
  } catch {
    return user
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Restore the session on mount: if tokens exist, /users/me rehydrates the
  // user; otherwise the context stays signed out.
  useEffect(() => {
    let cancelled = false
    if (tokenStore.access !== null) {
      api
        .get<UserSummary>('/users/me')
        .then((res) => enrichUser(res.data))
        .then((hydrated) => {
          if (!cancelled) setUser(hydrated)
        })
        .catch(() => {
          tokenStore.clear()
        })
    }
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (body: LoginRequest) => {
      setError(null)
      try {
        setUser(await enrichUser(hydrate(await authApi.login(body))))
      } catch (e) {
        setError(errorMessage(e))
        throw e
      }
    },
    [],
  )

  const register = useCallback(
    async (body: RegisterRequest) => {
      setError(null)
      try {
        setUser(await enrichUser(hydrate(await authApi.register(body))))
      } catch (e) {
        setError(errorMessage(e))
        throw e
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      tokenStore.clear()
      setUser(null)
      queryClient.clear()
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      setUser,
      error,
      clearError: () => setError(null),
    }),
    [user, login, register, logout, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
