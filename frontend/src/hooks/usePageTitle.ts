import { useEffect } from 'react'

/**
 * Updates document.title with the page-specific label and branding suffix.
 */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    if (title && title.trim()) {
      const trimmed = title.trim()
      document.title = trimmed.endsWith('· ClassDesk') ? trimmed : `${trimmed} · ClassDesk`
    } else {
      document.title = 'ClassDesk'
    }
  }, [title])
}
