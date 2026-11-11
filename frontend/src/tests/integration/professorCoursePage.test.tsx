import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { AppShell } from '@/components/layout/AppShell'
import { ProfessorDashboardPage } from '@/features/admin/ProfessorDashboardPage'
import { ProfessorCoursePage } from '@/features/admin/ProfessorCoursePage'
import { RequireAuth, RequireRole } from '@/app/guards'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { resetDemoData } from '@/services/storage'

describe('Integration: Professor Course Page & Navigation', () => {
  beforeEach(() => {
    resetDemoData()
  })

  it('renders course header, badges, join code, and temporary assignments placeholder', async () => {
    // Prof. Meera Iyer viewing WEB101
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<ProfessorDashboardPage />} />
          <Route path="courses/:courseId" element={<ProfessorCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    // Course title, code and semester
    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(screen.getByText('WEB101 · Autumn 2026')).toBeInTheDocument()
    expect(screen.getByText('WEB-4K7P')).toBeInTheDocument()
    expect(screen.getByText('Students join with this code')).toBeInTheDocument()

    // Back to courses link
    const backLink = screen.getByRole('link', { name: /back to courses/i })
    expect(backLink).toHaveAttribute('href', '/admin')

    // Temporary assignments placeholder
    expect(
      screen.getByText('Assignments for this course arrive in the next step'),
    ).toBeInTheDocument()
  })

  it('shows friendly "could not find that course" state when visiting another professors course', async () => {
    // Prof. Meera Iyer attempting to view course-dsa201 (taught by Prof. Arjun Mehta)
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<ProfessorDashboardPage />} />
          <Route path="courses/:courseId" element={<ProfessorCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-dsa201'],
      },
    )

    // Friendly 404 without leaking info
    expect(await screen.findByText("We couldn't find that course")).toBeInTheDocument()
    expect(screen.queryByText('Data Structures & Algorithms')).not.toBeInTheDocument()
  })

  it('navigation shows "Courses" item and marks it active on /admin/courses/:courseId', async () => {
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<ProfessorDashboardPage />} />
          <Route path="courses/:courseId" element={<ProfessorCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()

    // Find the Courses nav link specifically in the Main navigation
    const mainNav = screen.getByRole('navigation', { name: 'Main' })
    const coursesNavLink = within(mainNav).getByRole('link', { name: 'Courses' })
    expect(coursesNavLink).toBeInTheDocument()
    // Should have active styles (bg-primary)
    expect(coursesNavLink.className).toContain('bg-primary')
  })

  it('redirects an authenticated student away from /admin to /student', async () => {
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <RequireRole role="admin">
                <ProfessorDashboardPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="/student" element={<div>Student Home Page</div>} />
      </Routes>,
      {
        initialEntries: ['/admin'],
      },
    )

    expect(await screen.findByText('Student Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Your courses')).not.toBeInTheDocument()
  })
})
