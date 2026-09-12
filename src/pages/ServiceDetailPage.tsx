import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, ErrorState, Input, LoadingState, Textarea } from '@/components/ui'
import { addressApi, bookingApi, serviceApi } from '@/api'
import { errorMessage } from '@/api/client'
import type { CreateAddressBody } from '@/api'
import { formatPrice } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'

/**
 * Service detail + booking flow. Progressive disclosure: pick the schedule,
 * then the address (creating one inline if the customer has none), review,
 * confirm. The server re-prices everything — the summary is informational.
 */
export function ServiceDetailPage(): React.ReactElement {
  const { id } = useParams()
  const serviceId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const service = useQuery({
    queryKey: ['services', serviceId],
    queryFn: () => serviceApi.get(serviceId),
    enabled: Number.isFinite(serviceId),
    staleTime: 5 * 60 * 1000,
  })

  const { isAuthenticated } = useAuth()

  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressApi.list(0, 50),
    // Only fetch saved addresses for signed-in users — avoids 401 noise.
    enabled: isAuthenticated,
  })

  const [step, setStep] = useState<'schedule' | 'address' | 'review'>('schedule')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [note, setNote] = useState('')
  const [addressId, setAddressId] = useState<number | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const createBooking = useMutation({
    mutationFn: () =>
      bookingApi.create({
        providerId: service.data!.providerId,
        serviceId,
        addressId: addressId!,
        scheduledStart: new Date(start).toISOString(),
        scheduledEnd: new Date(end).toISOString(),
        customerNote: note || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void navigate('/bookings')
    },
  })

  if (service.isLoading) return <LoadingState rows={2} />
  if (service.isError) return <ErrorState message={errorMessage(service.error)} onRetry={() => void service.refetch()} />
  if (service.data == null) return <ErrorState message="Service not found." />

  const s = service.data
  const addressList = addresses.data?.content ?? []

  function next(): void {
    setFormError(null)
    if (step === 'schedule') {
      if (start === '' || end === '' || new Date(end) <= new Date(start)) {
        setFormError('Choose a valid schedule — the end must be after the start.')
        return
      }
      setStep('address')
      return
    }
    if (step === 'address') {
      if (addressId === null) {
        setFormError('Choose an address or add a new one.')
        return
      }
      setStep('review')
    }
  }

  function submit(e: FormEvent): void {
    e.preventDefault()
    setFormError(null)
    createBooking.mutate()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-bamboo">Service</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">{s.name}</h1>
        {s.description && <p className="mt-2 text-sm text-muted">{s.description}</p>}
        <div className="mt-3 flex items-center gap-3">
          <span className="font-display text-2xl font-semibold text-ink">{formatPrice(s.basePrice)}</span>
          <Badge>{s.pricingType.toLowerCase()}</Badge>
          {s.durationMinutes != null && <span className="text-sm text-muted">~{s.durationMinutes} min</span>}
        </div>
      </div>

      <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Booking progress">
        {(['schedule', 'address', 'review'] as const).map((label, i) => {
          const currentIndex = ['schedule', 'address', 'review'].indexOf(step)
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 ${
                  i <= currentIndex ? 'bg-bamboo text-white' : 'border border-line bg-surface text-muted'
                }`}
              >
                {i + 1}. {label}
              </span>
              {i < 2 && <span aria-hidden="true" className="text-muted">→</span>}
            </li>
          )
        })}
      </ol>

      <Card className="p-6">
        {!isAuthenticated && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">Sign in to book</h2>
            <p className="text-sm text-muted">Create a free account to pick a schedule and confirm this booking.</p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="rounded-sm bg-bamboo px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bamboo-deep"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-sm border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-bamboo/40"
              >
                Create an account
              </Link>
            </div>
          </div>
        )}

        {isAuthenticated && step === 'schedule' && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">When do you need it?</h2>
            <Input label="Start" name="start" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
            <Input label="End" name="end" type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} />
            <Button onClick={next}>Continue</Button>
          </div>
        )}

        {isAuthenticated && step === 'address' && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Where should the pro come?</h2>
            {addresses.isLoading && <LoadingState rows={1} />}
            {addressList.length > 0 && !showNewAddress && (
              <fieldset className="space-y-2">
                <legend className="sr-only">Saved addresses</legend>
                {addressList.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors ${
                      addressId === a.id ? 'border-bamboo bg-bamboo-soft/60' : 'border-line hover:border-bamboo/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === a.id}
                      onChange={() => setAddressId(a.id)}
                      className="mt-1 accent-[#17493b]"
                    />
                    <span className="text-sm">
                      <span className="block font-semibold text-ink">{a.label ?? 'Address'}</span>
                      <span className="block text-muted">
                        {a.addressLine}, {a.city}, {a.region} {a.postalCode}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {showNewAddress ? (
              <NewAddressForm
                onCreated={(created) => {
                  setAddressId(created.id)
                  setShowNewAddress(false)
                  void queryClient.invalidateQueries({ queryKey: ['addresses'] })
                }}
                onCancel={() => setShowNewAddress(false)}
              />
            ) : (
              <Button variant="secondary" onClick={() => setShowNewAddress(true)}>
                + Add a new address
              </Button>
            )}
            <Button onClick={next} disabled={addressId === null}>
              Review booking
            </Button>
          </div>
        )}

        {isAuthenticated && step === 'review' && (
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">Review your booking</h2>
            <dl className="divide-y divide-line text-sm">
              <Row label="Service">{s.name}</Row>
              <Row label="When">
                {new Date(start).toLocaleString('en-PH')} → {new Date(end).toLocaleString('en-PH')}
              </Row>
              <Row label="Address">
                {(() => {
                  const a = addressList.find((x) => x.id === addressId)
                  return a ? `${a.addressLine}, ${a.city}` : '—'
                })()}
              </Row>
              <Row label="Estimated price">
                {formatPrice(s.basePrice)} <span className="text-muted">({s.pricingType.toLowerCase()})</span>
              </Row>
            </dl>
            <Textarea
              label="Notes for the pro (optional)"
              name="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {(formError !== null || createBooking.isError) && (
              <p role="alert" className="rounded-sm bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                {formError ?? errorMessage(createBooking.error)}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep('address')}>
                Back
              </Button>
              <Button type="submit" loading={createBooking.isPending}>
                Confirm booking
              </Button>
            </div>
          </form>
        )}

        {(formError !== null && step !== 'review') && (
          <p role="alert" className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {formError}
          </p>
        )}
      </Card>

      <p className="text-center text-sm text-muted">
        Prefer to talk first?{' '}
        <Link to={`/providers/${s.providerId}`} className="font-semibold text-bamboo hover:underline">
          View the provider's profile
        </Link>
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="font-semibold text-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  )
}

function NewAddressForm({
  onCreated,
  onCancel,
}: {
  onCreated: (address: { id: number }) => void
  onCancel: () => void
}): React.ReactElement {
  const [form, setForm] = useState({ label: '', addressLine: '', city: '', region: '', postalCode: '', country: 'Philippines' })
  const [coords, setCoords] = useState({ latitude: '', longitude: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set(field: keyof typeof form, value: string): void {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function save(): Promise<void> {
    setError(null)
    const latitude = Number(coords.latitude)
    const longitude = Number(coords.longitude)
    if (coords.latitude === '' || coords.longitude === '' || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Latitude and longitude are required (use your map pin coordinates).')
      return
    }
    setSaving(true)
    try {
      const body: CreateAddressBody = {
        label: form.label,
        addressLine: form.addressLine,
        city: form.city,
        region: form.region,
        postalCode: form.postalCode,
        country: form.country,
        latitude,
        longitude,
      }
      const created = await addressApi.create(body)
      onCreated(created as { id: number })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-sm border border-line bg-paper p-4">
      <Input label="Label" name="label" placeholder="Home" required value={form.label} onChange={(e) => set('label', e.target.value)} />
      <Input label="Address line" name="addressLine" placeholder="123 Rizal St., Brgy. Malitlit" required value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="City" name="city" required value={form.city} onChange={(e) => set('city', e.target.value)} />
        <Input label="Region / province" name="region" required value={form.region} onChange={(e) => set('region', e.target.value)} />
        <Input label="Postal code" name="postalCode" required value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
        <Input label="Country" name="country" required value={form.country} onChange={(e) => set('country', e.target.value)} />
        <Input label="Latitude" name="latitude" placeholder="14.3290" required value={coords.latitude} onChange={(e) => setCoords((c) => ({ ...c, latitude: e.target.value }))} />
        <Input label="Longitude" name="longitude" placeholder="120.9050" required value={coords.longitude} onChange={(e) => setCoords((c) => ({ ...c, longitude: e.target.value }))} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => void save()} loading={saving}>
          Save address
        </Button>
      </div>
    </div>
  )
}
