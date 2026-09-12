import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

export function RegisterPage(): React.ReactElement {
  const { register, error: serverError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', phone: '', password: '', confirm: '' })
  const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  function update(field: keyof typeof form, value: string): void {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setLocalError(null)
    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await register({
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirm,
        roles: [role],
      })
      navigate('/', { replace: true })
    } catch {
      // surfaced by auth hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pt-6 sm:pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Join Serbisyo</h1>
      <p className="mt-2 text-sm text-muted">One account to book services or offer your own.</p>
      <Card className="mt-6 p-6 sm:p-8">
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <fieldset>
            <legend className="mb-2 block text-sm font-semibold text-ink">I want to…</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <RoleOption
                selected={role === 'CUSTOMER'}
                onSelect={() => setRole('CUSTOMER')}
                title="Get services"
                detail="Book verified pros near me."
              />
              <RoleOption
                selected={role === 'PROVIDER'}
                onSelect={() => setRole('PROVIDER')}
                title="Offer services"
                detail="List my work and get booked."
              />
            </div>
          </fieldset>
          <Input
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            minLength={8}
            hint="At least 8 characters."
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
          <Input
            label="Confirm password"
            name="confirm"
            type="password"
            required
            error={form.confirm && form.password !== form.confirm ? 'Passwords do not match' : undefined}
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
          />
          {(localError !== null || serverError !== null) && (
            <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {localError ?? serverError}
            </p>
          )}
          <Button type="submit" loading={submitting} disabled={form.confirm !== form.password} className="w-full">
            Create account
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-bamboo hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function RoleOption({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  detail: string
}): React.ReactElement {
  return (
    <label
      className={`cursor-pointer rounded-sm border p-3 transition-colors ${
        selected ? 'border-bamboo bg-bamboo-soft/60' : 'border-line hover:border-bamboo/40'
      }`}
    >
      <span className="flex items-center gap-2">
        <input type="radio" name="role" checked={selected} onChange={onSelect} className="accent-[#17493b]" />
        <span className="text-sm font-semibold text-ink">{title}</span>
      </span>
      <span className="mt-1 block pl-6 text-xs text-muted">{detail}</span>
    </label>
  )
}

