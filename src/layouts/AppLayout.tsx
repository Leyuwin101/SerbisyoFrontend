import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CalendarDays, Compass, Home, Inbox, MessageCircle, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useQueries'

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
    isActive ? 'bg-bamboo-soft text-bamboo-deep' : 'text-muted hover:text-ink'
  }`

function Wordmark(): React.ReactElement {
  return (
    <Link to="/" className="flex items-baseline gap-1.5" aria-label="Serbisyo home">
      <span className="font-display text-xl font-semibold tracking-tight text-bamboo">Serbisyo</span>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
    </Link>
  )
}

export function AppLayout(): React.ReactElement {
  const { isAuthenticated, user, logout } = useAuth()
  const { data: unread } = useUnreadCount(isAuthenticated)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu whenever navigation happens.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const authenticatedLinks = [
    { to: '/bookings', label: 'Bookings' },
    { to: '/notifications', label: 'Notifications' },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      {/* Floating pill nav — detached from the top edge, glass over content. */}
      <header className="sticky top-3 z-40 mx-auto w-[calc(100%-2rem)] max-w-6xl sm:top-4">
        <div className="flex h-14 items-center justify-between gap-4 rounded-full border border-line bg-surface/85 px-4 shadow-sm shadow-bamboo/5 backdrop-blur-md sm:px-5">
          <Wordmark />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/services" className={navLinkClass}>
              Services
            </NavLink>
            <NavLink to="/providers" className={navLinkClass}>
              Find pros
            </NavLink>
            {isAuthenticated &&
              authenticatedLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass}>
                  {link.label}
                  {link.to === '/notifications' && unread !== undefined && unread > 0 && (
                    <span aria-hidden="true" className="ml-1.5 inline-block size-2 rounded-full bg-gold" />
                  )}
                </NavLink>
              ))}
          </nav>
          <div className="flex items-center gap-1">
            {isAuthenticated && user ? (
              <>
                <NavLink to="/messages" className={navLinkClass}>
                  Messages
                </NavLink>
                <button
                  onClick={() => void logout()}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  to="/login"
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-bamboo transition-colors hover:bg-bamboo-soft"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-bamboo px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-bamboo-deep active:scale-[0.97]"
                >
                  Join Serbisyo
                </Link>
              </div>
            )}
            <button
              className="rounded-full p-2 text-ink sm:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="transition-transform duration-300">
                {menuOpen ? (
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mt-2 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg shadow-bamboo/5 backdrop-blur-md sm:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/services" className={navLinkClass}>
                Services
              </NavLink>
              <NavLink to="/providers" className={navLinkClass}>
                Find pros
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/bookings" className={navLinkClass}>
                    Bookings
                  </NavLink>
                  <NavLink to="/messages" className={navLinkClass}>
                    Messages
                  </NavLink>
                  <NavLink to="/notifications" className={navLinkClass}>
                    Notifications
                  </NavLink>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <NavLink to="/login" className={navLinkClass}>
                    Sign in
                  </NavLink>
                  <NavLink to="/register" className={navLinkClass}>
                    Join Serbisyo
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Intentional mobile navigation, not a hidden desktop nav. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="Mobile primary"
      >
        <div className="grid grid-cols-5">
          <MobileTab to="/" label="Home" icon={<Home size={20} strokeWidth={1.75} />} end />
          <MobileTab to="/services" label="Browse" icon={<Compass size={20} strokeWidth={1.75} />} />
          {isAuthenticated ? (
            <>
              <MobileTab to="/bookings" label="Bookings" icon={<CalendarDays size={20} strokeWidth={1.75} />} />
              <MobileTab to="/messages" label="Messages" icon={<MessageCircle size={20} strokeWidth={1.75} />} />
              <MobileTab
                to="/notifications"
                label="Inbox"
                icon={<Inbox size={20} strokeWidth={1.75} />}
                badge={unread !== undefined && unread > 0}
              />
            </>
          ) : (
            <MobileTab to="/login" label="Sign in" icon={<User size={20} strokeWidth={1.75} />} />
          )}
        </div>
      </nav>

      <footer className="mt-8 border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Trusted local services, booked in minutes. Every provider is verified by the Serbisyo team.
            </p>
          </div>
          <FooterCol
            title="Explore"
            links={{
              'Browse services': '/services',
              'Find pros': '/providers',
            }}
          />
          <FooterCol
            title="For customers"
            links={{
              Bookings: '/bookings',
              Favorites: '/favorites',
              Addresses: '/addresses',
            }}
          />
          <FooterCol
            title="Get started"
            links={{
              'Sign in': '/login',
              'Create an account': '/register',
            }}
          />
        </div>
        <div className="border-t border-line py-5 text-center text-sm text-muted">
          © {new Date().getFullYear()} Serbisyo — trusted local services, booked in minutes.
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: Record<string, string> }): React.ReactElement {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-3 space-y-2">
        {Object.entries(links).map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-muted transition-colors hover:text-bamboo-deep">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MobileTab({
  to,
  label,
  icon,
  end,
  badge,
}: {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
  badge?: boolean
}): React.ReactElement {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
          isActive ? 'text-bamboo-deep' : 'text-muted'
        }`
      }
    >
      <span className="relative" aria-hidden="true">
        {icon}
        {badge && <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-gold" />}
      </span>
      {label}
    </NavLink>
  )
}
