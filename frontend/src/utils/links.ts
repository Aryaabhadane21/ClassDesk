/**
 * Checks whether a given URL string points to a Microsoft OneDrive or SharePoint domain.
 * Supports http and https protocols for:
 * - 1drv.ms
 * - onedrive.live.com
 * - *.sharepoint.com (and sharepoint.com)
 * - *.onedrive.com (and onedrive.com)
 */
export function isLikelyOneDriveLink(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const trimmed = url.trim()
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }

    const host = parsed.hostname.toLowerCase()

    if (host === '1drv.ms' || host === 'onedrive.live.com') {
      return true
    }

    if (host === 'onedrive.com' || host.endsWith('.onedrive.com')) {
      return true
    }

    if (host === 'sharepoint.com' || host.endsWith('.sharepoint.com')) {
      return true
    }

    return false
  } catch {
    return false
  }
}
