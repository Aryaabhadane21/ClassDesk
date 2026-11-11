import type { ReactNode } from 'react'
import { Logo, ThemeToggle } from '@/components/ui'

export interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Shared split-screen layout for authentication pages (Login and Register).
 * Left column contains the form and branding; right column displays a solid brand-color panel.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-app text-fg flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
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
        <main className="w-full max-w-[420px] mx-auto my-6 sm:my-8 space-y-6">
          {children}
        </main>

        {/* Spacer to balance flex layout without footer tagline */}
        <div className="shrink-0 h-4" aria-hidden="true" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT COLUMN: Solid Brand-Color Panel (lg and up)             */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full flex-col justify-end p-12 lg:p-16 bg-primary text-primary-fg border-l border-line select-none">
        <div className="max-w-md space-y-2">
          <p className="font-display text-2xl lg:text-3xl font-medium tracking-tight text-white leading-snug">
            Every assignment, one clear view.
          </p>
        </div>
      </div>
    </div>
  )
}
