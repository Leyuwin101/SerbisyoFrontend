import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  Bell, Bookmark, CalendarDays, ChevronDown, Compass, Home, MapPin, MessageCircle, Search, UserRound,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories, useConversations, useUnreadCount } from '@/hooks/useQueries'
import { Avatar } from '@/components/Avatar'
import { Container } from '@/components/ui'

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ease-serbisyo ${
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
  const { data: conversations } = useConversations(isAuthenticated)
  const { data: categories } = useCategories()
  const conversationsUnread = (conversations?.content ?? []).reduce((sum, c) => sum + c.unreadCount, 0)
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close transient menus whenever navigation happens.
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Dismiss the user dropdown on outside click / Escape.
  useEffect(() => {
    if (!userMenuOpen) return
    const onDown = (e: MouseEvent): void => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [userMenuOpen])

  const submitSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    navigate(query.trim() ? `/services?q=${encodeURIComponent(query.trim())}` : '/services')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      {/* Sticky marketplace header: brand · search · actions, with a category strip below. */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <Container size="wide">
          <div className="flex h-16 items-center gap-4">
            <Wordmark />

            {/* Center search — the platform's primary interaction on desktop. */}
            <form onSubmit={submitSearch} role="search" className="hidden min-w-0 flex-1 justify-center md:flex">
              <div className="flex w-full max-w-xl items-center gap-2.5 rounded-full border border-line bg-paper px-4 py-2 transition-colors duration-300 focus-within:border-bamboo/60 focus-within:bg-surface">
                <Search size={17} className="shrink-0 text-muted" aria-hidden="true" />
                <label htmlFor="header-search" className="sr-only">What service do you need?</label>
                <input
                  id="header-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What service do you need?"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/60"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-bamboo px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-bamboo-deep active:scale-[0.97]"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Right actions, prioritised: explore links, account, alerts. */}
            <div className="ml-auto flex items-center gap-1">
              <NavLink to="/services" className={({ isActive }) => `hidden lg:inline-flex ${navLinkClass({ isActive })}`}>
                Explore
              </NavLink>
              <NavLink to="/providers" className={({ isActive }) => `hidden lg:inline-flex ${navLinkClass({ isActive })}`}>
                Find pros
              </NavLink>
              {isAuthenticated ? (
                <>
                  <IconNavLink to="/messages" label="Messages" badge={conversationsUnread > 0}>
                    <MessageCircle size={19} strokeWidth={1.75} />
                  </IconNavLink>
                  <IconNavLink to="/notifications" label="Notifications" badge={(unread ?? 0) > 0}>
                    <Bell size={19} strokeWidth={1.75} />
                  </IconNavLink>
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen((open) => !open)}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      aria-label="Account menu"
                      className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-bamboo-soft"
                    >
                      <Avatar name={user?.displayName ?? user?.email ?? 'You'} avatarKey={user?.avatarUrl} size={30} />
                      <ChevronDown size={14} className={`text-muted transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {userMenuOpen && (
                      <div
                        role="menu"
                        aria-label="Account"
                        className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-line bg-surface py-1.5 shadow-lg shadow-bamboo/10"
                      >
                        <MenuItem to="/profile" icon={<UserRound size={15} strokeWidth={1.75} />}>Profile</MenuItem>
                        <MenuItem to="/bookings" icon={<CalendarDays size={15} strokeWidth={1.75} />}>My bookings</MenuItem>
                        <MenuItem to="/favorites" icon={<Bookmark size={15} strokeWidth={1.75} />}>Favorites</MenuItem>
                        <div className="my-1 border-t border-line" />
                        <button
                          role="menuitem"
                          onClick={() => void logout()}
                          className="w-full px-3 py-2 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/login"
                    className="rounded-full px-3 py-2 text-sm font-semibold text-bamboo transition-colors hover:bg-bamboo-soft"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-bamboo px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-serbisyo hover:bg-bamboo-deep active:scale-[0.97]"
                  >
                    Join
                  </Link>
                </div>
              )}
              <button
                className="rounded-full p-2 text-ink md:hidden"
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
        </Container>

        {/* Secondary category navigation — horizontal scroll everywhere. */}
        {categories && categories.content.length > 0 && (
          <nav aria-label="Categories" className="border-t border-line/70">
            <Container size="wide">
              <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
                {categories.content.map((category) => (
                  <Link
                    key={category.id}
                    to={`/providers?categoryId=${category.id}`}
                    className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors duration-300 hover:bg-bamboo-soft hover:text-bamboo-deep"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </Container>
          </nav>
        )}

        {menuOpen && (
          <nav className="border-t border-line bg-surface px-4 py-3 md:hidden" aria-label="Mobile menu">
            <div className="flex flex-col gap-1">
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/services" className={navLinkClass}>Explore services</NavLink>
              <NavLink to="/providers" className={navLinkClass}>Find pros</NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink to="/bookings" className={navLinkClass}>Bookings</NavLink>
                  <NavLink to="/messages" className={navLinkClass}>Messages</NavLink>
                  <NavLink to="/notifications" className={navLinkClass}>Notifications</NavLink>
                  <NavLink to="/favorites" className={navLinkClass}>Favorites</NavLink>
                  <NavLink to="/addresses" className={navLinkClass}>Addresses</NavLink>
                  <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
                </>
              ) : (
                <NavLink to="/register" className={navLinkClass}>Become a provider</NavLink>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Intentional mobile navigation, not a hidden desktop nav. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mobile primary"
      >
        <div className="grid grid-cols-5">
          <MobileTab to="/" label="Home" icon={<Home size={20} strokeWidth={1.75} />} end />
          <MobileTab to="/services" label="Browse" icon={<Compass size={20} strokeWidth={1.75} />} />
          {isAuthenticated ? (
            <>
              <MobileTab to="/bookings" label="Bookings" icon={<CalendarDays size={20} strokeWidth={1.75} />} />
              <MobileTab
                to="/messages"
                label="Messages"
                icon={<MessageCircle size={20} strokeWidth={1.75} />}
                badge={conversationsUnread > 0}
              />
              <MobileTab
                to="/profile"
                label="Profile"
                icon={<UserRound size={20} strokeWidth={1.75} />}
              />
            </>
          ) : (
            <MobileTab to="/login" label="Sign in" icon={<UserRound size={20} strokeWidth={1.75} />} />
          )}
        </div>
      </nav>

      <SiteFooter />
    </div>
  )
}

function IconNavLink({
  to,
  label,
  badge,
  children,
}: {
  to: string
  label: string
  badge?: boolean
  children: React.ReactNode
}): React.ReactElement {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className="relative rounded-full p-2 text-muted transition-colors duration-300 hover:bg-bamboo-soft hover:text-bamboo-deep"
    >
      <span aria-hidden="true">{children}</span>
      {badge && <span aria-hidden="true" className="absolute right-1 top-1 size-2 rounded-full bg-gold" />}
    </NavLink>
  )
}

function MenuItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }): React.ReactElement {
  return (
    <NavLink
      role="menuitem"
      to={to}
      className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-bamboo-soft"
    >
      <span aria-hidden="true" className="text-muted">{icon}</span>
      {children}
    </NavLink>
  )
}

function FooterSection({ title, links }: { title: string; links: Record<string, string> }): React.ReactElement {
  const entries = Object.entries(links)
  return (
    <>
      {/* Desktop: plain column. Mobile: native collapsible accordion. */}
      <div className="md:hidden">
        <details className="group border-b border-line/70 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {title}
            <ChevronDown size={15} className="text-muted transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="mt-3 space-y-2.5 pb-1">
            {entries.map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="text-sm text-muted transition-colors hover:text-bamboo-deep">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <ul className="mt-3 space-y-2">
          {entries.map(([label, to]) => (
            <li key={to}>
              <Link to={to} className="text-sm text-muted transition-colors hover:text-bamboo-deep">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function SiteFooter(): React.ReactElement {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <Container size="wide">
        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Trusted Filipino professionals, booked in minutes. Every provider is verified by the Serbisyo team before
              they can accept bookings.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted">
              <MapPin size={13} aria-hidden="true" /> Made for the Philippines · prices in ₱
            </p>
          </div>
          <FooterSection
            title="Platform"
            links={{
              'Browse services': '/services',
              'Find pros': '/providers',
              'How it works': '/',
            }}
          />
          <FooterSection
            title="For customers"
            links={{
              Bookings: '/bookings',
              Messages: '/messages',
              Favorites: '/favorites',
              Addresses: '/addresses',
              Notifications: '/notifications',
            }}
          />
          <FooterSection
            title="For providers"
            links={{
              'Become a provider': '/register',
              'Provider profile': '/profile',
            }}
          />
          <FooterSection
            title="Get started"
            links={{
              'Sign in': '/login',
              'Create an account': '/register',
            }}
          />
        </div>
      </Container>
      <div className="border-t border-line">
        <Container size="wide">
          <div className="flex flex-col items-center justify-between gap-2 py-5 text-center text-sm text-muted sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} Serbisyo — trusted local services, booked in minutes.</p>
            <p className="text-xs">Prices in Philippine pesos (₱)</p>
          </div>
        </Container>
      </div>
    </footer>
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
