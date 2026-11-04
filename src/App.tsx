import { useEffect, useState } from 'react'
import type { Theme } from '@/types'

// temporary, replaced in a later step
export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="min-h-screen bg-app p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Surface Card */}
        <section className="bg-surface rounded-lg p-8 border border-line shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">
              Theme Token Preview
            </span>
            {/* Temporary Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-1.5 rounded-pill text-xs font-semibold border border-line bg-surface-2 text-fg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Toggle theme: <span className="font-bold">{theme}</span>
            </button>
          </div>

          <div>
            <h1 className="font-display text-4xl font-semibold text-fg tracking-tight">
              ClassDesk
            </h1>
            <p className="font-body text-base text-muted mt-2">
              An assignment and review dashboard for students and instructors.
              Experience seamless workflow management with clean design tokens.
            </p>
          </div>

          {/* Badges preview */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted">Status &amp; Accent Badges</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-accent-soft text-accent">
                Accent Badge
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-success-soft text-success">
                Success Status
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-warning-soft text-warning">
                Warning Status
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-danger-soft text-danger">
                Danger Status
              </span>
              <span className="px-3 py-1 rounded-pill text-xs font-medium bg-info-soft text-info">
                Info Status
              </span>
            </div>
          </div>

          {/* Primary Pill Button */}
          <div className="pt-2 flex items-center justify-between border-t border-line">
            <button
              type="button"
              className="px-6 py-2.5 rounded-pill bg-primary text-primary-fg font-medium text-sm shadow-pop cursor-pointer hover:opacity-90 transition-opacity"
            >
              Pill Primary Button
            </button>
            <span className="text-xs text-muted">
              Font changes per theme (Fraunces/Inter ⇄ Outfit)
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
