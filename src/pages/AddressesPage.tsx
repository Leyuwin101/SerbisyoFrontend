import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader } from '@/components/ui'
import { addressApi } from '@/api'
import { errorMessage } from '@/api/client'
import type { CreateAddressBody } from '@/api'
import type { Address } from '@/types'

/** The customer's address book; ownership is enforced server-side. */
export function AddressesPage(): React.ReactElement {
  const queryClient = useQueryClient()
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => addressApi.list(0, 50) })
  const [showForm, setShowForm] = useState(false)

  const remove = useMutation({
    mutationFn: (id: number) => addressApi.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Addresses"
        subtitle="Where your pros will show up."
        actions={
          <Button onClick={() => setShowForm((open) => !open)}>{showForm ? 'Close' : '+ Add address'}</Button>
        }
      />

      {showForm && (
        <Card className="p-6">
          <AddressForm
            onCreated={() => {
              setShowForm(false)
              void queryClient.invalidateQueries({ queryKey: ['addresses'] })
            }}
          />
        </Card>
      )}

      {addresses.isLoading && <LoadingState rows={2} />}
      {addresses.isError && (
        <ErrorState message={errorMessage(addresses.error)} onRetry={() => void addresses.refetch()} />
      )}
      {addresses.data && addresses.data.content.length === 0 && !showForm && (
        <EmptyState
          title="No addresses yet"
          hint="Add one now so booking a pro takes seconds later."
          action={<Button onClick={() => setShowForm(true)}>Add your first address</Button>}
        />
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.data?.content.map((a) => (
          <li key={a.id}>
            <AddressCard address={a} onRemove={() => remove.mutate(a.id)} removing={remove.isPending} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function AddressCard({
  address,
  onRemove,
  removing,
}: {
  address: Address
  onRemove: () => void
  removing: boolean
}): React.ReactElement {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-ink">{address.label ?? 'Address'}</p>
        <button
          onClick={onRemove}
          disabled={removing}
          className="text-xs font-semibold text-red-700 transition-colors hover:text-red-900 disabled:opacity-50"
          aria-label={`Delete ${address.label ?? 'address'}`}
        >
          Delete
        </button>
      </div>
      <p className="mt-2 flex-1 text-sm text-muted">
        {address.addressLine}
        <br />
        {[address.locality, address.city, address.region, address.postalCode].filter(Boolean).join(', ')}
        <br />
        {address.country}
      </p>
      {address.latitude != null && address.longitude != null && (
        <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
          {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
        </p>
      )}
    </Card>
  )
}

export function AddressForm({ onCreated }: { onCreated: () => void }): React.ReactElement {
  const [form, setForm] = useState({
    label: '',
    addressLine: '',
    locality: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Philippines',
  })
  const [coords, setCoords] = useState({ latitude: '', longitude: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set(field: keyof typeof form, value: string): void {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    const latitude = Number(coords.latitude)
    const longitude = Number(coords.longitude)
    if (coords.latitude === '' || coords.longitude === '' || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Latitude and longitude are required (use your map pin coordinates).')
      return
    }
    setSaving(true)
    try {
      const body: CreateAddressBody = { ...form, latitude, longitude }
      await addressApi.create(body)
      onCreated()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      <Input label="Label" name="label" placeholder="Home" required value={form.label} onChange={(e) => set('label', e.target.value)} />
      <Input label="Address line" name="addressLine" placeholder="123 Rizal St., Brgy. Malitlit" required value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} />
      <Input label="Locality (barangay)" name="locality" value={form.locality} onChange={(e) => set('locality', e.target.value)} />
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
      <Button type="submit" loading={saving} className="w-full sm:w-auto">
        Save address
      </Button>
    </form>
  )
}
