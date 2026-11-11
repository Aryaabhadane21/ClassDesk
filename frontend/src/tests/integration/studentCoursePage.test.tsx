import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { AppShell } from '@/components/layout/AppShell'
import { StudentDashboardPage } from '@/features/student/StudentDashboardPage'
import { StudentCoursePage } from '@/features/student/StudentCoursePage'
import { RequireAuth, RequireRole } from '@/app/guards'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { resetDemoData } from '@/services/storage'

describe('Integration: Student Course Page & Navigation', () => {
  beforeEach(() => {
    resetDemoData()
  })

  it('renders course header, instructor avatar, group chip, and temporary assignments placeholder', async () => {
    // Aarav Sharma viewing WEB101 (where he is Leader of Team Alpha)
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-web101'],
      },
    )

    // Course title, code and semester
    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(screen.getByText('WEB101 · Autumn 2026')).toBeInTheDocument()
    expect(screen.getByText('Prof. Meera Iyer')).toBeInTheDocument()
    expect(screen.getByText('Team Alpha · Leader')).toBeInTheDocument()

    // Back to courses link
    const backLink = screen.getByRole('link', { name: /back to courses/i })
    expect(backLink).toHaveAttribute('href', '/student')

    // Temporary assignments placeholder
    expect(
      screen.getByText('Assignments for this course arrive in the next step'),
    ).toBeInTheDocument()
  })

  it('shows friendly "could not find that course" state when visiting a course the student is not enrolled in', async () => {
    // Aarav Sharma attempting to view course-osy301 (which he is not enrolled in)
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-osy301'],
      },
    )

    // Friendly 404 without leaking info
    expect(await screen.findByText("We couldn't find that course")).toBeInTheDocument()
    expect(screen.queryByText('Operating Systems')).not.toBeInTheDocument()
  })

  it('navigation shows "Courses" item and marks it active on /student/courses/:courseId', async () => {
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-web101'],
      },
    )

    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()

    // Find the Courses nav link in the Main navigation
    const mainNav = screen.getByRole('navigation', { name: 'Main' })
    const coursesNavLink = within(mainNav).getByRole('link', { name: 'Courses' })
    expect(coursesNavLink).toBeInTheDocument()
    // Should have active styles (bg-primary)
    expect(coursesNavLink.className).toContain('bg-primary')
  })

  it('redirects an authenticated professor away from /student to /admin', async () => {
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(
      <Routes>
        <Route
          path="/student/*"
          element={
            <RequireAuth>
              <RequireRole role="student">
                <StudentDashboardPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="/admin" element={<div>Professor Home Page</div>} />
      </Routes>,
      {
        initialEntries: ['/student'],
      },
    )

    expect(await screen.findByText('Professor Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Your courses')).not.toBeInTheDocument()
  })
})
