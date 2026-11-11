import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PublicOnlyRoute } from '@/app/guards'
import { resetDemoData } from '@/services/storage'
import { createToken, setStoredToken } from '@/services/auth/token'

describe('Integration: Register Flow', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
    resetDemoData()
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    const submitBtn = screen.getByRole('button', { name: /create account/i })
    await user.click(submitBtn)

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/choose a role/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })

  it('validates invalid inputs: bad email, weak password, mismatched confirm password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitBtn = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'Alex Morgan')
    await user.type(emailInput, 'notanemail')
    await user.type(passwordInput, 'weak')
    await user.type(confirmPasswordInput, 'different')
    await user.click(submitBtn)

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    expect(screen.getByText(/choose a role/i)).toBeInTheDocument()
  })

  it('updates live password checklist dynamically while typing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/^password/i)

    // Initially: none met
    const lengthItem = screen.getByText(/at least 8 characters/i).parentElement!
    const letterItem = screen.getByText(/contains a letter/i).parentElement!
    const numberItem = screen.getByText(/contains a number/i).parentElement!

    expect(lengthItem).toHaveTextContent(/not met/i)
    expect(letterItem).toHaveTextContent(/not met/i)
    expect(numberItem).toHaveTextContent(/not met/i)

    // Type letters only: letter met, others not met
    await user.type(passwordInput, 'abc')
    expect(letterItem).toHaveTextContent(/\(met\)/i)
    expect(lengthItem).toHaveTextContent(/not met/i)
    expect(numberItem).toHaveTextContent(/not met/i)

    // Type numbers to satisfy length and number
    await user.type(passwordInput, '12345')
    expect(lengthItem).toHaveTextContent(/\(met\)/i)
    expect(letterItem).toHaveTextContent(/\(met\)/i)
    expect(numberItem).toHaveTextContent(/\(met\)/i)
  })

  it('focuses the first invalid field upon failed submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const submitBtn = screen.getByRole('button', { name: /create account/i })

    // When all are empty, focuses name
    await user.click(submitBtn)
    expect(document.activeElement).toBe(nameInput)

    // When name is filled, focuses email
    await user.type(nameInput, 'Alex Morgan')
    await user.click(submitBtn)
    expect(document.activeElement).toBe(emailInput)
  })

  it('displays error on email field when email is already registered and focuses it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const studentTile = screen.getByLabelText(/student/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitBtn = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'Aarav Imposter')
    await user.type(emailInput, 'aarav.sharma@classdesk.edu')
    await user.click(studentTile)
    await user.type(passwordInput, 'SecurePass123')
    await user.type(confirmPasswordInput, 'SecurePass123')
    await user.click(submitBtn)

    const duplicateError = await screen.findByText(/an account with this email already exists/i)
    expect(duplicateError).toBeInTheDocument()
    expect(document.activeElement).toBe(emailInput)
  })

  it('successfully registers as a student and redirects to /student with welcome toast', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student" element={<div>Student Portal Screen</div>} />
        <Route path="/admin" element={<div>Admin Portal Screen</div>} />
      </Routes>,
      {
        initialEntries: ['/register'],
      },
    )

    await user.type(screen.getByLabelText(/full name/i), 'Devendra Bapat')
    await user.type(screen.getByLabelText(/email address/i), 'devendra.bapat@classdesk.edu')
    await user.click(screen.getByLabelText(/student/i))
    await user.type(screen.getByLabelText(/^password/i), 'Pass12345')
    await user.type(screen.getByLabelText(/confirm password/i), 'Pass12345')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Redirects to student dashboard
    expect(await screen.findByText('Student Portal Screen')).toBeInTheDocument()
    // Shows toast with first name
    expect(screen.getByText(/welcome to classdesk, devendra/i)).toBeInTheDocument()
  })

  it('successfully registers as a professor and redirects to /admin with welcome toast', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student" element={<div>Student Portal Screen</div>} />
        <Route path="/admin" element={<div>Admin Portal Screen</div>} />
      </Routes>,
      {
        initialEntries: ['/register'],
      },
    )

    await user.type(screen.getByLabelText(/full name/i), 'Prof. Sunita Rao')
    await user.type(screen.getByLabelText(/email address/i), 'sunita.rao@classdesk.edu')
    await user.click(screen.getByLabelText(/professor/i))
    await user.type(screen.getByLabelText(/^password/i), 'ProfPass2026')
    await user.type(screen.getByLabelText(/confirm password/i), 'ProfPass2026')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Redirects to admin dashboard
    expect(await screen.findByText('Admin Portal Screen')).toBeInTheDocument()
    expect(screen.getByText(/welcome to classdesk, prof\./i)).toBeInTheDocument()
  })

  it('allows newly registered user to sign out and sign in again with the same credentials', async () => {
    const user = userEvent.setup()
    const newEmail = 'newbie@classdesk.edu'
    const newPassword = 'Password123'

    const { unmount } = renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/student" element={<div>Student Home Area</div>} />
      </Routes>,
      {
        initialEntries: ['/register'],
      },
    )

    // 1. Register
    await user.type(screen.getByLabelText(/full name/i), 'Newbie Student')
    await user.type(screen.getByLabelText(/email address/i), newEmail)
    await user.click(screen.getByLabelText(/student/i))
    await user.type(screen.getByLabelText(/^password/i), newPassword)
    await user.type(screen.getByLabelText(/confirm password/i), newPassword)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Student Home Area')).toBeInTheDocument()
    unmount()

    // 2. Clear token (logout) and visit /login
    const { removeStoredToken } = await import('@/services/auth/token')
    removeStoredToken()

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student" element={<div>Student Home Area</div>} />
      </Routes>,
      {
        initialEntries: ['/login'],
      },
    )

    // 3. Login with registered credentials
    await user.type(screen.getByLabelText(/email address/i), newEmail)
    await user.type(screen.getByLabelText(/^password/i), newPassword)
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Student Home Area')).toBeInTheDocument()
  })

  it('redirects an authenticated user visiting /register away to their home page', async () => {
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    setStoredToken(token)

    renderWithProviders(
      <Routes>
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/student" element={<div>Student Protected Home</div>} />
      </Routes>,
      {
        initialEntries: ['/register'],
      },
    )

    expect(await screen.findByText('Student Protected Home')).toBeInTheDocument()
    expect(screen.queryByText(/create your account/i)).not.toBeInTheDocument()
  })

  it('contains a link to the sign-in page', () => {
    renderWithProviders(<RegisterPage />)
    const signinLink = screen.getByRole('link', { name: /sign in/i })
    expect(signinLink).toBeInTheDocument()
    expect(signinLink).toHaveAttribute('href', '/login')
  })
})
