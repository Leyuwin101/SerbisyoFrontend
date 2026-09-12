import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, ExternalLink, ShieldCheck, Star } from 'lucide-react'
import { authApi, providerApi, userApi } from '@/api'
import { errorMessage } from '@/api/client'
import { Badge, Button, Card, Input, Textarea } from '@/components/ui'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useMyProviderProfile } from '@/hooks/useQueries'
import type { ProviderSummary } from '@/types'

/**
 * Self-service profile, identity first — like a Fiverr seller page: photo and
 * name up top (what everyone else sees), then what only you see. Each section
 * saves on its own so a photo upload never disturbs a half-typed form.
 */
export function ProfilePage(): React.ReactElement {
  const { user, setUser } = useAuth()
  const isProvider = user?.role === 'PROVIDER'
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const { data: provider } = useMyProviderProfile(isProvider)

  const shownName = isProvider
    ? provider?.businessName ?? 'Your business'
    : user?.displayName ?? 'Set your name'

  const upload = useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: () => {
      setAvatarError(null)
      // Re-hydrate the session user so the header photo updates immediately.
      userApi
        .myProfile()
        .then((profile) => {
          if (user) {
            setUser({
              ...user,
              avatarUrl: profile.customer?.avatarUrl ?? profile.provider?.avatarUrl ?? null,
            })
          }
        })
        .catch(() => {})
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
    onError: (e) => setAvatarError(errorMessage(e)),
  })

  const pickFile = (): void => fileInput.current?.click()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setAvatarError('Photos only — JPG, PNG, WebP or GIF.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Photos are capped at 5 MB.')
      return
    }
    setAvatarError(null)
    upload.mutate(file)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Identity — photo, name, trust. Nothing else matters before this. */}
      <header className="overflow-hidden rounded-xl border border-line bg-surface">
        <div aria-hidden="true" className="h-20 bg-bamboo-soft sm:h-24" />
        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex items-end justify-between sm:-mt-12">
            <div className="relative">
              <Avatar
                name={shownName}
                avatarKey={user?.avatarUrl ?? provider?.avatarUrl}
                size={80}
                className="ring-4 ring-paper"
              />
              <button
                type="button"
                onClick={pickFile}
                disabled={upload.isPending}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-line bg-surface text-bamboo shadow-sm transition-colors hover:bg-bamboo-soft disabled:opacity-60"
              >
                {upload.isPending ? (
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                ) : (
                  <Camera size={15} strokeWidth={1.75} />
                )}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onFile}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
            {isProvider ? (
              <Link
                to={`/providers/${provider?.id ?? ''}`}
                className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-bamboo hover:underline"
              >
                View public profile
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            ) : (
              <span className="mb-1 rounded-full bg-bamboo-soft px-3 py-1 text-xs font-semibold text-bamboo-deep">
                Customer
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {shownName}
          </h1>

          {isProvider ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <Star size={14} className="text-gold" aria-hidden="true" />
                <span className="font-semibold text-ink">
                  {provider?.averageRating != null ? provider.averageRating.toFixed(1) : 'New'}
                </span>
                {provider?.reviewCount != null && <span>({provider.reviewCount})</span>}
              </span>
              {provider?.verificationStatus === 'VERIFIED' && (
                <span className="inline-flex items-center gap-1 text-bamboo-deep">
                  <ShieldCheck size={14} aria-hidden="true" /> Verified
                </span>
              )}
              <span>{user?.email}</span>
            </div>
          ) : (
            <p className="mt-1 truncate text-sm text-muted">{user?.email}</p>
          )}

          {avatarError && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {avatarError}
            </p>
          )}
          <p className="mt-3 text-sm text-muted">
            {isProvider
              ? 'Customers see your photo, name and ratings wherever they find you.'
              : 'Your name and photo appear on reviews and messages — not your email.'}
          </p>
        </div>
      </header>

      {/* What others see */}
      {isProvider ? <BusinessSection provider={provider ?? null} /> : <CustomerSection />}

      {/* What only you see */}
      <section aria-label="Account settings" className="mt-6 space-y-6">
        <AccountSection />
        <PasswordSection />
      </section>
    </div>
  )
}

// ---------- public profile: customer ----------
function CustomerSection(): React.ReactElement {
  const { user, setUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDisplayName(user?.displayName ?? '')
  }, [user?.displayName])

  const save = useMutation({
    mutationFn: () => userApi.updateCustomerProfile({ displayName: displayName.trim() }),
    onSuccess: (updated) => {
      if (user) {
        setUser({ ...user, displayName: updated.displayName })
      }
      setError(null)
      setSaved(true)
    },
    onError: (e) => setError(errorMessage(e)),
  })

  const dirty = displayName.trim() !== (user?.displayName ?? '')

  return (
    <Card className="mt-6 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Public name</h2>
        {saved && <Badge tone="green">Saved</Badge>}
      </div>
      <form
        className="mt-4 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          setSaved(false)
          save.mutate()
        }}
      >
        <Input
          label="Display name"
          name="displayName"
          value={displayName}
          placeholder="e.g. Maria Santos"
          onChange={(e) => {
            setDisplayName(e.target.value)
            setSaved(false)
          }}
          error={error ?? undefined}
          hint="Shown on your reviews and messages"
        />
        <div>
          <Button type="submit" loading={save.isPending} disabled={!dirty}>
            Save name
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ---------- account details (every role) ----------
function AccountSection(): React.ReactElement {
  const { user, setUser } = useAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setPhone(user.phone ?? '')
    }
  }, [user])

  const save = useMutation({
    mutationFn: () =>
      userApi.update({
        email: email.trim() !== user?.email ? email.trim() : undefined,
        phone: phone.trim() !== (user?.phone ?? '') ? phone.trim() : undefined,
      }),
    onSuccess: (updated) => {
      setUser(updated)
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      setError(null)
      setSaved(true)
    },
    onError: (e) => setError(errorMessage(e)),
  })

  const dirty = email !== (user?.email ?? '') || phone !== (user?.phone ?? '')

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Sign-in details</h2>
        {saved && <Badge tone="green">Saved</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">This is how Serbisyo contacts you about bookings.</p>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          setSaved(false)
          save.mutate()
        }}
      >
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setSaved(false)
          }}
          error={error ?? undefined}
        />
        <Input
          label="Phone"
          name="phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setSaved(false)
          }}
          hint="Digits only, 10–15 characters"
        />
        <div className="sm:col-span-2">
          <Button type="submit" loading={save.isPending} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ---------- public profile: provider ----------
function BusinessSection({ provider }: { provider: ProviderSummary | null }): React.ReactElement {
  const [businessName, setBusinessName] = useState(provider?.businessName ?? '')
  const [bio, setBio] = useState(provider?.bio ?? '')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (provider) {
      setBusinessName(provider.businessName)
      setBio(provider.bio ?? '')
    }
  }, [provider])

  const save = useMutation({
    mutationFn: () => providerApi.updateProfile({ businessName: businessName.trim(), bio: bio.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers'] })
      setSaveError(null)
      setSaved(true)
    },
    onError: (e) => setSaveError(errorMessage(e)),
  })

  return (
    <Card className="mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Business profile</h2>
        {saved && <Badge tone="green">Saved</Badge>}
        {provider?.verificationStatus && (
          <Badge tone={provider.verificationStatus === 'VERIFIED' ? 'green' : 'gold'}>
            {provider.verificationStatus === 'VERIFIED' ? 'Verified' : provider.verificationStatus}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">What customers see when they find you.</p>
      <form
        className="mt-4 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          setSaved(false)
          save.mutate()
        }}
      >
        <Input
          label="Business name"
          name="businessName"
          value={businessName}
          onChange={(e) => {
            setBusinessName(e.target.value)
            setSaved(false)
          }}
          error={saveError ?? undefined}
        />
        <Textarea
          label="About your business"
          name="bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value)
            setSaved(false)
          }}
        />
        <div>
          <Button type="submit" loading={save.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ---------- security ----------
function PasswordSection(): React.ReactElement {
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNext] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword, newPassword }),
    onSuccess: (res) => {
      setMessage(res.message ?? 'Password updated.')
      setError(null)
      setCurrent('')
      setNext('')
    },
    onError: (e) => setError(errorMessage(e)),
  })

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Change password</h2>
      <p className="mt-1 text-sm text-muted">Choose a password you do not use anywhere else.</p>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          setMessage(null)
          save.mutate()
        }}
      >
        <Input
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          error={error ?? undefined}
        />
        <Input
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNext(e.target.value)}
        />
        {message && (
          <p className="text-sm font-medium text-bamboo-deep sm:col-span-2" role="status">
            {message}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" loading={save.isPending} disabled={!currentPassword || !newPassword}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  )
}
