import type { ReactNode } from 'react'

export function Skeleton({ className = '' }: { className?: string }): React.ReactElement {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/** Card-shaped skeleton that mirrors the ProviderCard layout (banner + text rows). */
export function ProviderCardSkeleton(): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface" aria-hidden="true">
      <div className="skeleton h-20 rounded-none" />
      <div className="p-4 pt-6">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton mt-2.5 h-3 w-full" />
        <div className="skeleton mt-2 h-3 w-5/6" />
        <div className="mt-4 border-t border-line pt-3">
          <div className="skeleton h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

export function LoadingState({ rows = 3, className = '' }: { rows?: number; className?: string }): React.ReactElement {
  return (
    <div className={`space-y-4 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }): React.ReactElement {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center" role="alert">
      <p className="font-medium text-red-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-sm bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }): React.ReactElement {
  return <div className={`rounded-lg border border-line bg-surface ${className}`}>{children}</div>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'green' | 'gold' | 'red' | 'blue'
}): React.ReactElement {
  const tones = {
    neutral: 'bg-paper text-muted border-line',
    green: 'bg-bamboo-soft text-bamboo-deep border-bamboo/20',
    gold: 'bg-gold-soft text-[#8a5a10] border-gold/30',
    red: 'bg-red-50 text-red-800 border-red-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
  } as const
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Stars({ rating, count }: { rating: number | null; count?: number | null }): React.ReactElement {
  return (
    <span className="inline-flex items-baseline gap-1 text-sm">
      <span aria-hidden="true" className="font-semibold text-gold">★</span>
      <span className="font-semibold text-ink">{rating != null ? rating.toFixed(1) : 'New'}</span>
      {count != null && <span className="text-muted">({count})</span>}
      <span className="sr-only">{rating != null ? `Rated ${rating.toFixed(1)} out of 5` : 'No ratings yet'}</span>
    </span>
  )
}

/** Booking status → tone mapping shared by every screen. */
export function statusTone(status: string): 'neutral' | 'green' | 'gold' | 'red' | 'blue' {
  switch (status) {
    case 'COMPLETED':
      return 'green'
    case 'PENDING':
      return 'gold'
    case 'CONFIRMED':
    case 'PROVIDER_ON_THE_WAY':
    case 'IN_PROGRESS':
      return 'blue'
    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED':
      return 'red'
    default:
      return 'neutral'
  }
}

const buttonVariants = {
  primary: 'bg-bamboo text-white hover:bg-bamboo-deep active:scale-[0.98]',
  secondary: 'border border-line bg-surface text-ink hover:border-bamboo/40 hover:bg-bamboo-soft/50 active:scale-[0.98]',
  ghost: 'text-bamboo hover:bg-bamboo-soft active:scale-[0.98]',
  danger: 'bg-red-700 text-white hover:bg-red-800 active:scale-[0.98]',
} as const

export function Button({
  children,
  variant = 'primary',
  disabled,
  loading,
  onClick,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  variant?: keyof typeof buttonVariants
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
  'aria-label'?: string
}): React.ReactElement {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
    >
      {loading && (
        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}

export function Input({
  label,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }): React.ReactElement {
  const id = props.id ?? props.name
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-sm border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-bamboo ${
          error ? 'border-red-400' : 'border-line'
        }`}
      />
      {error && (
        <span id={`${id}-error`} className="mt-1 block text-xs font-medium text-red-700">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${id}-hint`} className="mt-1 block text-xs text-muted">
          {hint}
        </span>
      )}
    </div>
  )
}

export function Textarea({
  label,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }): React.ReactElement {
  const id = props.id ?? props.name
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <textarea
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-sm border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-bamboo ${
          error ? 'border-red-400' : 'border-line'
        }`}
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </div>
  )
}
