import { describe, it, expect } from 'vitest'
import { isLikelyOneDriveLink } from '@/utils/links'

describe('Unit: isLikelyOneDriveLink', () => {
  it('returns true for 1drv.ms short links over http and https', () => {
    expect(isLikelyOneDriveLink('https://1drv.ms/f/s!Am1-web101-portfolio')).toBe(true)
    expect(isLikelyOneDriveLink('http://1drv.ms/u/s!test')).toBe(true)
  })

  it('returns true for onedrive.live.com', () => {
    expect(isLikelyOneDriveLink('https://onedrive.live.com/?id=root&cid=12345')).toBe(true)
  })

  it('returns true for onedrive.com and subdomains', () => {
    expect(isLikelyOneDriveLink('https://onedrive.com/view.aspx?resid=abc')).toBe(true)
    expect(isLikelyOneDriveLink('https://photos.onedrive.com/share/xyz')).toBe(true)
    expect(isLikelyOneDriveLink('https://my.sub.onedrive.com/path')).toBe(true)
  })

  it('returns true for sharepoint.com and tenant subdomains', () => {
    expect(isLikelyOneDriveLink('https://contoso.sharepoint.com/:f:/r/sites/ClassDesk')).toBe(true)
    expect(isLikelyOneDriveLink('https://university-my.sharepoint.com/personal/student')).toBe(true)
    expect(isLikelyOneDriveLink('http://sharepoint.com/home')).toBe(true)
  })

  it('returns false for non-OneDrive domains', () => {
    expect(isLikelyOneDriveLink('https://google.com/drive')).toBe(false)
    expect(isLikelyOneDriveLink('https://dropbox.com/s/1234')).toBe(false)
    expect(isLikelyOneDriveLink('https://github.com/classdesk')).toBe(false)
    expect(isLikelyOneDriveLink('https://notonedrive.com')).toBe(false)
    expect(isLikelyOneDriveLink('https://fake-1drv.ms.phishing.com')).toBe(false)
  })

  it('returns false for invalid, non-http, or empty strings', () => {
    expect(isLikelyOneDriveLink('')).toBe(false)
    expect(isLikelyOneDriveLink('   ')).toBe(false)
    expect(isLikelyOneDriveLink('not-a-url')).toBe(false)
    expect(isLikelyOneDriveLink('ftp://1drv.ms/file')).toBe(false)
    expect(isLikelyOneDriveLink('javascript:alert(1)')).toBe(false)
  })
})
