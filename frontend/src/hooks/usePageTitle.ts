import { useEffect } from 'react'

/**
 * Updates document.title with the page-specific label and branding suffix.
 */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    if (title && title.trim()) {
      document.title = `${title.trim()} · ClassDesk`
    } else {
      document.title = 'ClassDesk'
    }
  }, [title])
}
