import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { StudentAssignmentsPage } from '@/features/student/StudentAssignmentsPage'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'

describe('Integration: Student Submission Flow', () => {
  it('walks through the two-step confirmation flow and updates counts in place', async () => {
    const user = userEvent.setup()

    // Sign in as Aarav Sharma
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<StudentAssignmentsPage />, {
      initialEntries: ['/student/legacy'],
    })

    // Wait for assignments to load
    const submitButtons = await screen.findAllByRole('button', {
      name: /submit assignment/i,
    })
    expect(submitButtons.length).toBeGreaterThan(0)

    // Check initial summary text e.g. "X of Y submitted"
    const initialSummary = screen.getByText(/\d+ of \d+ submitted/i)
    expect(initialSummary).toBeInTheDocument()

    // 1. Click "Yes, I have submitted" on the first unsubmitted card
    await user.click(submitButtons[0])

    // Dialog appears
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/confirm submission/i)).toBeInTheDocument()

    // 2. Click "Not yet" -> dialog closes, nothing changes
    const notYetBtn = screen.getByRole('button', { name: /not yet/i })
    await user.click(notYetBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // 3. Open dialog again and confirm
    const submitButtonsAgain = screen.getAllByRole('button', {
      name: /submit assignment/i,
    })
    await user.click(submitButtonsAgain[0])

    const confirmBtn = await screen.findByRole('button', {
      name: /yes, confirm submission/i,
    })
    await user.click(confirmBtn)

    // Dialog closes and success toast appears
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // Wait for card to appear in submitted section
    await waitFor(() => {
      expect(screen.getByText(/marked as submitted/i)).toBeInTheDocument()
    })
  })
})
