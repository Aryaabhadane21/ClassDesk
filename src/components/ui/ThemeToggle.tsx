import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'
  const ariaLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-pill bg-surface-2 border border-line text-fg transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-fg transition-transform duration-200" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-fg transition-transform duration-200" aria-hidden="true" />
      )}
    </button>
  )
}
