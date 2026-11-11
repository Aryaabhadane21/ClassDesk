import { useState, type ReactNode } from 'react'
import { GradientBlob, Logo, ThemeToggle } from '@/components/ui'

export interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Shared split-screen layout for authentication pages (Login and Register).
 * Left column contains the form and branding; right column displays the full-bleed hero image.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false)

  return (
    <div className="min-h-screen bg-app text-fg flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* MOBILE / TABLET BANNER (Below lg only, 200px full-width)       */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:hidden w-full h-[200px] overflow-hidden border-b border-line relative shrink-0 bg-surface-2">
        {!heroImgFailed ? (
          <img
            src="/images/login-hero.jpg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            onError={() => setHeroImgFailed(true)}
            className="w-full h-full object-cover object-[center_35%] scale-115 origin-top-left"
          />
        ) : (
          <GradientBlob seed="mobile-login-hero" variant="hero" className="h-full w-full" />
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LEFT COLUMN: Form Side                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 lg:w-1/2 flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-y-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between w-full max-w-xl mx-auto shrink-0">
          <Logo size="md" />
          <ThemeToggle />
        </header>

        {/* Centered Main Form Area */}
        <main className="w-full max-w-[420px] mx-auto my-8 space-y-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-muted shrink-0 pt-4">
          ClassDesk &bull; Responsive Assignment &amp; Review Dashboard
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT COLUMN: Full-Bleed Hero Image (lg and up)               */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden lg:block lg:w-1/2 relative h-full overflow-hidden border-l border-line bg-surface-2 select-none">
        {!heroImgFailed ? (
          <img
            src="/images/login-hero.jpg"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            onError={() => setHeroImgFailed(true)}
            className="w-full h-full object-cover scale-112 origin-top-left"
          />
        ) : (
          <GradientBlob seed="classdesk-desktop-cover" variant="hero" className="w-full h-full" />
        )}

        {/* Bottom-left glass caption card */}
        <div className="absolute bottom-8 left-8 max-w-md p-6 bg-surface/90 backdrop-blur-md border border-line shadow-card text-left space-y-1.5 z-10 rounded-lg">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            Every assignment, one clear view.
          </h2>
          <p className="font-body text-sm text-muted">
            Students track what&apos;s due. Professors see who&apos;s done.
          </p>
        </div>
      </div>
    </div>
  )
}
