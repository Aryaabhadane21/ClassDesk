import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { Avatar, Badge, IconButton, Logo, ThemeToggle } from '@/components/ui'
import { NotificationBell } from '@/components/notifications'
import { NotificationProvider } from '@/hooks/useNotifications'
import { useAuth } from '@/context/AuthContext'
import { getHomePath } from '@/utils/routes'
import { getNavItemsForRole } from '@/components/layout/navConfig'
import { getGreetingName } from '@/utils/names'
import { roleLabel } from '@/utils/roles'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/utils/cn'

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Mobile drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [location.pathname])

  // Shared focus trap for mobile drawer
  useFocusTrap({
    containerRef: drawerRef,
    isActive: isDrawerOpen,
    onClose: () => setIsDrawerOpen(false),
    initialFocusRef: drawerRef,
    lockScroll: true,
  })

  if (!user) return null

  const navItems = getNavItemsForRole(user.role)
  const homePath = getHomePath(user.role)
  const greetingName = getGreetingName(user.name)

  const isNavActive = (href: string, defaultActive: boolean) => {
    if (href === '/admin') {
      return (
        location.pathname === '/admin' ||
        location.pathname.startsWith('/admin/courses') ||
        location.pathname.startsWith('/admin/assignments')
      )
    }
    if (href === '/student') {
      return location.pathname === '/student' || location.pathname.startsWith('/student/assignments')
    }
    return defaultActive
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-app text-fg">
      {/* 1. Skip to Main Content Link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 rounded-pill bg-primary text-primary-fg font-medium text-xs shadow-pop border border-line focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Skip to main content
      </a>

      {/* ------------------------------------------------------------- */}
      {/* 2. DESKTOP SIDEBAR (lg and up)                                 */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden lg:flex flex-col justify-between fixed top-0 bottom-0 left-0 w-[270px] bg-surface border-r border-line z-30 p-6 select-none">
        <div className="space-y-8">
          {/* Logo brand */}
          <NavLink
            to={homePath}
            className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
            aria-label="ClassDesk Home"
          >
            <Logo size="md" />
          </NavLink>

          {/* Navigation Links */}
          <nav className="space-y-2" aria-label="Main">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) => {
                    const active = isNavActive(item.href, isActive)
                    return cn(
                      'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium cursor-pointer',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                      'motion-safe:transition-all motion-safe:duration-150',
                      active
                        ? 'bg-primary text-primary-fg shadow-card'
                        : 'text-muted hover:text-fg hover:bg-surface-2 border border-transparent hover:border-line',
                    )
                  }}
                >
                  {({ isActive }) => {
                    const active = isNavActive(item.href, isActive)
                    return (
                      <>
                        <span
                          className={cn(
                            'w-7 h-7 rounded-md flex items-center justify-center shrink-0 motion-safe:transition-colors',
                            active
                              ? 'bg-accent/20 text-accent'
                              : 'bg-surface-2 text-muted group-hover:text-fg',
                          )}
                          aria-hidden="true"
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span>{item.label}</span>
                      </>
                    )
                  }}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Log out button */}
        <div className="pt-4 border-t border-line">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-muted hover:text-danger hover:bg-danger-soft/40 border border-transparent hover:border-danger/30 cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-danger',
              'motion-safe:transition-all motion-safe:duration-150',
            )}
          >
            <span
              className="w-7 h-7 rounded-md bg-surface-2 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <LogOut className="w-4 h-4" />
            </span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 3. MOBILE SLIDE-IN DRAWER (below lg)                          */}
      {/* ------------------------------------------------------------- */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs motion-safe:transition-opacity duration-200"
            aria-hidden="true"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer container */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            tabIndex={-1}
            className="relative w-[280px] max-w-[85vw] h-full bg-surface border-r border-line rounded-r-lg p-6 flex flex-col justify-between shadow-pop z-10 focus:outline-none"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="p-1 rounded-pill text-muted hover:text-fg hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2" aria-label="Mobile Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={item.end}
                      onClick={() => setIsDrawerOpen(false)}
                      className={({ isActive }) => {
                        const active = isNavActive(item.href, isActive)
                        return cn(
                          'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium cursor-pointer',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                          active
                            ? 'bg-primary text-primary-fg shadow-card'
                            : 'text-muted hover:text-fg hover:bg-surface-2 border border-transparent hover:border-line',
                        )
                      }}
                    >
                      {({ isActive }) => {
                        const active = isNavActive(item.href, isActive)
                        return (
                          <>
                            <span
                              className={cn(
                                'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                                active ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-muted',
                              )}
                              aria-hidden="true"
                            >
                              <Icon className="w-4 h-4" />
                            </span>
                            <span>{item.label}</span>
                          </>
                        )
                      }}
                    </NavLink>
                  )
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-line">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-muted hover:text-danger hover:bg-danger-soft/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN LAYOUT AREA (Top bar + scrollable content)            */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:pl-[270px] flex flex-col min-h-screen relative overflow-x-hidden">
        {/* Soft radial glow at top of content area */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 right-0 h-96 -z-10 overflow-hidden select-none"
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-pill bg-peach/10 dark:bg-accent/8 blur-3xl pointer-events-none" />
        </div>

        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-20 bg-app/80 backdrop-blur-md border-b border-line px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger button (Mobile only) */}
            <IconButton
              ref={hamburgerRef}
              variant="secondary"
              size="sm"
              aria-label="Open navigation"
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </IconButton>

            <span className="font-display font-semibold text-lg text-fg hidden sm:inline-block">
              ClassDesk
            </span>
          </div>

          {/* Right Top Bar Area */}
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBell />

            <ThemeToggle />

            <div className="h-5 w-[1px] bg-line hidden sm:block" aria-hidden="true" />

            <div className="flex items-center gap-2.5">
              <Avatar name={user.name} size="sm" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-fg">Hello, {greetingName}</span>
                <span className="text-[10px] text-muted leading-none">
                  {roleLabel(user.role)}
                </span>
              </div>
              <Badge tone="accent" size="sm" className="hidden md:inline-flex">
                {roleLabel(user.role)}
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 focus:outline-none animate-page-enter"
        >
          <Outlet />
        </main>
      </div>
    </div>
  </NotificationProvider>
  )
}
