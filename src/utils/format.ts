export function formatPrice(price: string | number | null | undefined): string {
  if (price == null) return '—'
  return `₱${Number(price).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
