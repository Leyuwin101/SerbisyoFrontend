import axios, { AxiosError, AxiosHeaders } from 'axios'
import type { ApiErrorBody } from '@/types'

const TOKEN_KEY = 'serbisyo.accessToken'
const REFRESH_KEY = 'serbisyo.refreshToken'

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(access: string, refresh: string): void {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
})

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.access
  if (token) {
    const headers = AxiosHeaders.from(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

// Response interceptor: transparent refresh on a single 401, then retry.
// Guards against refresh loops by flagging retried requests.
let refreshPromise: Promise<string | null> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config
    const status = error.response?.status

    if (
      status === 401 &&
      original &&
      !original.headers?.['X-Retried'] &&
      tokenStore.refresh
    ) {
      refreshPromise =
        refreshPromise ??
        axios
          .post<{ accessToken: string; refreshToken: string }>('/api/v1/auth/refresh', {
            token: tokenStore.refresh,
          })
          .then((res) => {
            tokenStore.set(res.data.accessToken, res.data.refreshToken)
            return res.data.accessToken
          })
          .catch(() => {
            tokenStore.clear()
            return null
          })
          .finally(() => {
            refreshPromise = null
          })

      const newToken = await refreshPromise
      if (newToken) {
        const headers = AxiosHeaders.from(original.headers)
        headers.set('Authorization', `Bearer ${newToken}`)
        headers.set('X-Retried', '1')
        original.headers = headers
        return api.request(original)
      }
    }

    return Promise.reject(error)
  },
)

/** Extract a user-friendly message from any error shape. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data
    if (body?.fieldErrors && Object.keys(body.fieldErrors).length > 0) {
      return Object.values(body.fieldErrors).join('; ')
    }
    if (body?.message) return body.message
    if (error.response?.status === 429) return 'Too many requests — please slow down.'
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is it running?'
  }
  return 'Something went wrong. Please try again.'
}
