import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { LoginPage } from '@/features/auth/LoginPage'

describe('Integration: Login Flow', () => {
  it('shows errors when submitting empty form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    const submitBtn = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitBtn)

    expect(screen.getByText(/email address is required/i)).toBeInTheDocument()

    // Now type email and leave password empty
    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'student@classdesk.edu')
    await user.click(submitBtn)

    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })

  it('shows error banner when credentials are wrong', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const submitBtn = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'student@classdesk.edu')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitBtn)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('fills the form when clicking demo student account', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    const demoButtons = screen.getAllByRole('button', { name: /aarav sharma/i })
    await user.click(demoButtons[0])

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement

    expect(emailInput.value).toBe('aarav.sharma@classdesk.edu')
    expect(passwordInput.value).toBe('demo1234')
  })

  it('successful login lands on the correct role home page', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student" element={<div>Student Dashboard View</div>} />
        <Route path="/admin" element={<div>Admin Dashboard View</div>} />
      </Routes>,
      {
        initialEntries: ['/login'],
      },
    )

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const submitBtn = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'aarav.sharma@classdesk.edu')
    await user.type(passwordInput, 'demo1234')
    await user.click(submitBtn)

    // Should redirect to /student
    await waitFor(() => {
      expect(screen.getByText('Student Dashboard View')).toBeInTheDocument()
    })
  })

  it('opens confirm dialog and resets demo data when requested', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    const resetButtons = screen.getAllByRole('button', { name: /reset demo data/i })
    await user.click(resetButtons[0])

    // Dialog appears with title and message
    expect(screen.getByText('Reset demo data?')).toBeInTheDocument()
    expect(
      screen.getByText(/this restores the original sample users, assignments and submissions/i),
    ).toBeInTheDocument()

    // Cancel closes the dialog
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelBtn)
    await waitFor(() => {
      expect(screen.queryByText('Reset demo data?')).not.toBeInTheDocument()
    })

    // Open again and confirm
    await user.click(resetButtons[0])
    const confirmBtn = screen.getByRole('button', { name: /reset data/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(screen.queryByText('Reset demo data?')).not.toBeInTheDocument()
      expect(screen.getByText(/demo data has been reset/i)).toBeInTheDocument()
    })
  })
})
