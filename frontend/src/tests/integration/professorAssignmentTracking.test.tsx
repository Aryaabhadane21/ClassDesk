import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { AppShell } from '@/components/layout/AppShell'
import { ProfessorCoursePage } from '@/features/admin/ProfessorCoursePage'
import { ProfessorAssignmentDetailPage } from '@/features/admin/ProfessorAssignmentDetailPage'
import { RequireAuth, RequireRole } from '@/app/guards'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { resetDemoData } from '@/services/storage'

describe('Integration: Professor Assignment Tracking & Drill-Down', () => {
  beforeEach(() => {
    resetDemoData()
  })

  const loginAsProfMeera = () => {
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }

  const loginAsProfArjun = () => {
    const token = createToken({
      id: 'user-admin-2',
      name: 'Prof. Arjun Mehta',
      email: 'arjun.mehta@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }

  it('renders progress bar, percentage, and "View submissions" button on course assignment cards', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route path="courses/:courseId" element={<ProfessorCoursePage />} />
          <Route
            path="courses/:courseId/assignments/:assignmentId"
            element={<ProfessorAssignmentDetailPage />}
          />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    // Wait for cards to appear
    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(await screen.findByText('Responsive Portfolio Website')).toBeInTheDocument()

    // Progress bar percentages on cards:
    // asg-web-01: 5 of 5 -> 100%
    // asg-web-02: 1 of 2 -> 50%
    // asg-web-03: 2 of 3 -> 67%
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()

    // "View submissions" buttons exist for all 3 cards
    const viewButtons = screen.getAllByRole('button', { name: /view submissions/i })
    expect(viewButtons.length).toBe(3)

    // Click "View submissions" on the first card
    await user.click(viewButtons[0])

    // Navigates to the assignment tracking page
    expect(
      await screen.findByRole('heading', { name: 'Responsive Portfolio Website' }),
    ).toBeInTheDocument()
    expect(screen.getByText('WEB101 · Autumn 2026')).toBeInTheDocument()
  })

  it('drill-down for individual assignment displays header, stat cards, progress bar, and student list with status badges and timestamps', async () => {
    loginAsProfMeera()

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route
            path="courses/:courseId/assignments/:assignmentId"
            element={<ProfessorAssignmentDetailPage />}
          />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101/assignments/asg-web-01'],
      },
    )

    // 1. Header & Metadata
    expect(
      await screen.findByRole('heading', { name: 'Responsive Portfolio Website' }),
    ).toBeInTheDocument()
    expect(screen.getByText('WEB101 · Autumn 2026')).toBeInTheDocument()
    expect(screen.getByText('Back to Web Development')).toBeInTheDocument()
    expect(screen.getByText('Individual')).toBeInTheDocument()
    expect(screen.getByText('All 5 students')).toBeInTheDocument()

    // Open OneDrive button
    const driveLink = screen.getByRole('button', { name: /open onedrive folder/i })
    expect(driveLink.closest('a')).toHaveAttribute(
      'href',
      'https://1drv.ms/f/s!Am1-web101-portfolio-turnin',
    )

    // 2. Summary StatCards
    const summarySection = screen.getByRole('region', { name: /summary/i })
    expect(within(summarySection).getByText('Submitted')).toBeInTheDocument()
    expect(within(summarySection).getByText('Pending')).toBeInTheDocument()
    expect(within(summarySection).getByText('Total assigned')).toBeInTheDocument()
    expect(within(summarySection).getByText('Completion')).toBeInTheDocument()

    // Tracking numbers for asg-web-01 (5 of 5 submitted, 100%)
    expect(screen.getByText('5 of 5 students submitted')).toBeInTheDocument()

    // 3. Student rows in table
    const table = screen.getByRole('table')
    expect(within(table).getByText('Aarav Sharma')).toBeInTheDocument()
    expect(within(table).getByText('aarav.sharma@classdesk.edu')).toBeInTheDocument()
    expect(within(table).getByText('Diya Patel')).toBeInTheDocument()
    expect(within(table).getByText('Rohan Gupta')).toBeInTheDocument()
    expect(within(table).getByText('Ananya Reddy')).toBeInTheDocument()
    expect(within(table).getByText('Kabir Singh')).toBeInTheDocument()

    // All 5 students show "Submitted" badge in the table
    const submittedBadges = within(table).getAllByText('Submitted')
    expect(submittedBadges.length).toBe(5)

    // Live result count
    expect(screen.getByText(/showing 5 of 5 students/i)).toBeInTheDocument()
  })

  it('drill-down for selected individual assignment displays correct submitted and pending statuses', async () => {
    loginAsProfMeera()

    // asg-web-03 is assigned to 3 students (Aarav, Diya, Ananya). Diya and Ananya submitted; Aarav is pending.
    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route
            path="courses/:courseId/assignments/:assignmentId"
            element={<ProfessorAssignmentDetailPage />}
          />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101/assignments/asg-web-03'],
      },
    )

    expect(
      await screen.findByRole('heading', { name: 'RESTful API Integration & Dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByText('3 selected students')).toBeInTheDocument()

    // Stat cards: 2 submitted, 1 pending, 3 total, 67%
    expect(screen.getByText('2 of 3 students submitted')).toBeInTheDocument()

    // 3 students in drill-down table
    const table = screen.getByRole('table')
    expect(within(table).getByText('Aarav Sharma')).toBeInTheDocument()
    expect(within(table).getByText('Diya Patel')).toBeInTheDocument()
    expect(within(table).getByText('Ananya Reddy')).toBeInTheDocument()

    // Diya and Ananya are submitted; Aarav is pending
    expect(within(table).getAllByText('Submitted').length).toBe(2)
    expect(within(table).getByText('Pending')).toBeInTheDocument()

    // Non-assigned students (e.g. Kabir Singh) should NOT be in the drill-down
    expect(within(table).queryByText('Kabir Singh')).not.toBeInTheDocument()
  })

  it('drill-down for group assignment shows groups, leader, members, and acknowledgement details', async () => {
    loginAsProfMeera()

    // asg-web-02 is group assignment in WEB101:
    // Team Alpha (Leader: Aarav; Members: Aarav, Diya, Rohan) - Acknowledged
    // Team Beta (Leader: Ananya; Members: Ananya, Kabir) - Pending
    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route
            path="courses/:courseId/assignments/:assignmentId"
            element={<ProfessorAssignmentDetailPage />}
          />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101/assignments/asg-web-02'],
      },
    )

    expect(
      await screen.findByRole('heading', { name: 'Team Project: Collaborative Task Board' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Group')).toBeInTheDocument()
    expect(screen.getByText('All groups')).toBeInTheDocument()

    // Stat cards: 1 acknowledged, 1 pending, 2 total, 50%
    expect(screen.getByText('1 of 2 groups acknowledged')).toBeInTheDocument()

    // Team Alpha card
    expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    expect(screen.getByText(/leader: aarav sharma/i)).toBeInTheDocument()
    expect(screen.getByText(/acknowledged by aarav sharma on/i)).toBeInTheDocument()

    // Team Beta card
    expect(screen.getByText('Team Beta')).toBeInTheDocument()
    expect(screen.getByText(/leader: ananya reddy/i)).toBeInTheDocument()
    expect(screen.getByText(/pending acknowledgement/i)).toBeInTheDocument()

    // Status badges present
    expect(screen.getAllByText('Acknowledged').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
  })

  it('filters by status tabs and searches by name in real time with live count', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route
            path="courses/:courseId/assignments/:assignmentId"
            element={<ProfessorAssignmentDetailPage />}
          />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101/assignments/asg-web-03'],
      },
    )

    // asg-web-03: Aarav (pending), Diya (submitted), Ananya (submitted)
    expect(
      await screen.findByRole('heading', { name: 'RESTful API Integration & Dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/showing 3 of 3 students/i)).toBeInTheDocument()

    const table = screen.getByRole('table')

    // 1. Filter by "Submitted" tab
    const submittedTab = screen.getByRole('radio', { name: /submitted \(2\)/i })
    await user.click(submittedTab)

    expect(within(table).getByText('Diya Patel')).toBeInTheDocument()
    expect(within(table).getByText('Ananya Reddy')).toBeInTheDocument()
    expect(within(table).queryByText('Aarav Sharma')).not.toBeInTheDocument()
    expect(screen.getByText(/showing 2 of 3 students \(filtered\)/i)).toBeInTheDocument()

    // 2. Filter by "Pending" tab
    const pendingTab = screen.getByRole('radio', { name: /pending \(1\)/i })
    await user.click(pendingTab)

    expect(within(table).getByText('Aarav Sharma')).toBeInTheDocument()
    expect(within(table).queryByText('Diya Patel')).not.toBeInTheDocument()
    expect(within(table).queryByText('Ananya Reddy')).not.toBeInTheDocument()
    expect(screen.getByText(/showing 1 of 3 students \(filtered\)/i)).toBeInTheDocument()

    // 3. Reset to "All" tab
    const allTab = screen.getByRole('radio', { name: /all \(3\)/i })
    await user.click(allTab)

    expect(within(table).getByText('Aarav Sharma')).toBeInTheDocument()
    expect(within(table).getByText('Diya Patel')).toBeInTheDocument()
    expect(within(table).getByText('Ananya Reddy')).toBeInTheDocument()

    // 4. Search by student name
    const searchInput = screen.getByPlaceholderText(/search by student name or email/i)
    await user.type(searchInput, 'Diya')

    expect(within(table).getByText('Diya Patel')).toBeInTheDocument()
    expect(within(table).queryByText('Aarav Sharma')).not.toBeInTheDocument()
    expect(within(table).queryByText('Ananya Reddy')).not.toBeInTheDocument()
    expect(screen.getByText(/showing 1 of 3 students \(filtered\)/i)).toBeInTheDocument()

    // 5. Search with no matches shows empty state
    await user.clear(searchInput)
    await user.type(searchInput, 'NonExistentStudent')

    expect(await screen.findByText('No matching students')).toBeInTheDocument()
    const clearBtn = screen.getByRole('button', { name: /clear filters/i })
    await user.click(clearBtn)

    // Resets and shows all students again
    const restoredTable = screen.getByRole('table')
    expect(within(restoredTable).getByText('Aarav Sharma')).toBeInTheDocument()
    expect(within(restoredTable).getByText('Diya Patel')).toBeInTheDocument()
    expect(within(restoredTable).getByText('Ananya Reddy')).toBeInTheDocument()
  })

  it('protects unauthorized access: foreign professor sees "could not find that assignment", student redirected', async () => {
    // 1. Prof. Arjun Mehta attempting to view Prof. Meera Iyer's assignment in WEB101
    loginAsProfArjun()

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AppShell />}>
          <Route
            path="courses/:courseId/assignments/:assignmentId"
            element={<ProfessorAssignmentDetailPage />}
          />
        </Route>
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101/assignments/asg-web-01'],
      },
    )

    // Friendly 404
    expect(await screen.findByText("We couldn't find that assignment")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to course/i })).toBeInTheDocument()
    expect(screen.queryByText('Responsive Portfolio Website')).not.toBeInTheDocument()

    // 2. Student trying to access the professor drill-down route
    const studentToken = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, studentToken)

    renderWithProviders(
      <Routes>
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <RequireRole role="admin">
                <ProfessorAssignmentDetailPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route path="/student" element={<div>Student Home Page</div>} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101/assignments/asg-web-01'],
      },
    )

    expect(await screen.findByText('Student Home Page')).toBeInTheDocument()
  })
})
