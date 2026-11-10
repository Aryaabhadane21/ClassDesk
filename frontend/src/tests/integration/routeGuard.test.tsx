import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { RequireAuth, RequireRole } from '@/app/guards'
import { STORAGE_KEYS } from '@/utils/constants'

describe('Integration: Route Guard Role Protection', () => {
  it('redirects an authenticated student away from /admin to /student', async () => {
    // Sign in as student
    window.localStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify('user-student-1'),
    )

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireRole role="admin">
                <div>Admin Secret Content</div>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="/student" element={<div>Student Home Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      {
        initialEntries: ['/admin'],
      },
    )

    // Should redirect to /student and display Student Home Page
    expect(await screen.findByText('Student Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Secret Content')).not.toBeInTheDocument()
  })

  it('redirects an unauthenticated user attempting to visit /student to /login', async () => {
    // Clear session
    window.localStorage.removeItem(STORAGE_KEYS.SESSION)

    renderWithProviders(
      <Routes>
        <Route
          path="/student"
          element={
            <RequireAuth>
              <RequireRole role="student">
                <div>Student Secret Content</div>
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      {
        initialEntries: ['/student'],
      },
    )

    expect(await screen.findByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Student Secret Content')).not.toBeInTheDocument()
  })
})
