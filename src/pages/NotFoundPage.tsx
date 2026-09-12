import { LinkButton } from '@/components/ui'

export function NotFoundPage(): React.ReactElement {
  return (
    <div className="py-24 text-center">
      <p aria-hidden="true" className="font-display text-6xl font-semibold tracking-tight text-bamboo/20 sm:text-7xl">
        404
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
        We couldn't find that page
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        The link may be broken, or the page may have moved. Everything you need is one click away.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <LinkButton to="/">Go home</LinkButton>
        <LinkButton to="/services" variant="secondary">
          Browse services
        </LinkButton>
      </div>
    </div>
  )
}
