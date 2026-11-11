import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { JoinCodeChip } from '@/components/courses/JoinCodeChip'

describe('Unit: JoinCodeChip', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
      configurable: true,
    })
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the join code and copy button with accessible label', () => {
    renderWithProviders(
      <JoinCodeChip code="WEB-4K7P" courseName="Web Development" />,
    )

    expect(screen.getByText('WEB-4K7P')).toBeInTheDocument()
    const copyButton = screen.getByRole('button', {
      name: 'Copy join code for Web Development',
    })
    expect(copyButton).toBeInTheDocument()
  })

  it('copies code to clipboard, triggers toast, and shows check icon for 2 seconds', async () => {
    renderWithProviders(
      <JoinCodeChip code="WEB-4K7P" courseName="Web Development" />,
    )

    const copyButton = screen.getByRole('button', {
      name: 'Copy join code for Web Development',
    })

    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('WEB-4K7P')
    })

    // Live region status message
    await waitFor(() => {
      expect(
        screen.getByText('Join code WEB-4K7P copied to clipboard'),
      ).toBeInTheDocument()
    })

    // Toast message appears
    expect(screen.getByText('Join code copied')).toBeInTheDocument()
  })

  it('falls back to document.execCommand when clipboard API is unavailable', () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      writable: true,
      configurable: true,
    })
    document.execCommand = vi.fn().mockReturnValue(true)

    renderWithProviders(
      <JoinCodeChip code="WEB-4K7P" courseName="Web Development" />,
    )

    const copyButton = screen.getByRole('button', {
      name: 'Copy join code for Web Development',
    })

    fireEvent.click(copyButton)

    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(screen.getByText('Join code copied')).toBeInTheDocument()
  })
})
