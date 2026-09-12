import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage(): React.ReactElement {
  const { login, isAuthenticated, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, from, navigate])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch {
      // error state is surfaced by the auth hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pt-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to book a pro or manage your services.</p>
      <Card className="mt-6 p-6">
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {error}
            </p>
          )}
          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        No account yet?{' '}
        <Link to="/register" className="font-semibold text-bamboo hover:underline" onClick={clearError}>
          Join Serbisyo
        </Link>
      </p>
    </div>
  )
}
