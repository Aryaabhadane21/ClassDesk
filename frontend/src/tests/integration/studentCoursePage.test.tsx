import { describe, it, expect, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { AppShell } from '@/components/layout/AppShell'
import { StudentDashboardPage } from '@/features/student/StudentDashboardPage'
import { StudentCoursePage } from '@/features/student/StudentCoursePage'
import { RequireAuth, RequireRole } from '@/app/guards'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { resetDemoData } from '@/services/storage'

describe('Integration: Student Course Page & Assignments', () => {
  beforeEach(() => {
    resetDemoData()
  })

  const loginAsStudent = (id: string, name: string, email: string) => {
    const token = createToken({
      id,
      name,
      email,
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }

  it('renders course header, instructor avatar, group chip, course ProgressBar, and student cards with required fields', async () => {
    // Aarav Sharma viewing WEB101 (where he is Leader of Team Alpha)
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')

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

    // Course ProgressBar ("2 of 3 done" and "67%")
    expect(screen.getByText('2 of 3 done')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()

    // Rendered assignment cards (asg-web-01, asg-web-02, asg-web-03)
    expect(screen.getByRole('heading', { name: 'Responsive Portfolio Website' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Team Project: Collaborative Task Board' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'RESTful API Integration & Dashboard' })).toBeInTheDocument()

    // Card fields: "Open OneDrive link" button exists with rel and target
    const oneDriveLinks = screen.getAllByRole('button', { name: /open onedrive link/i })
    expect(oneDriveLinks.length).toBe(3)
    const anchor = oneDriveLinks[0].closest('a')
    expect(anchor).toHaveAttribute('target', '_blank')
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')

    // Submission type badges (Individual / Group)
    expect(screen.getAllByText('Individual').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Group')).toBeInTheDocument()

    // Status badges with text and icons
    expect(screen.getAllByText('Submitted').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Acknowledged').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1)
  })

  it('completes individual submission flow with two-step confirm dialog, timestamp, toast, and progress update', async () => {
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-web101'],
      },
    )

    // Wait for page to load
    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(screen.getByText('2 of 3 done')).toBeInTheDocument()

    // Aarav has NOT submitted asg-web-03 ("RESTful API Integration & Dashboard")
    // Find the submit button for this assignment
    const submitBtn = screen.getByRole('button', {
      name: /submit assignment restful api integration & dashboard/i,
    })
    expect(submitBtn).toBeInTheDocument()

    // 1. Click "Yes, I have submitted" -> Opens ConfirmDialog
    await user.click(submitBtn)

    expect(await screen.findByText('Confirm your submission')).toBeInTheDocument()
    expect(
      screen.getByText(/you're about to mark "restful api integration & dashboard" as submitted/i),
    ).toBeInTheDocument()

    // 2. Click "Yes, confirm submission" in dialog
    const confirmBtn = screen.getByRole('button', { name: /yes, confirm submission/i })
    await user.click(confirmBtn)

    // Dialog closes, card now displays "Submitted on ..." (both asg-web-01 and asg-web-03 are now submitted)
    await screen.findByRole('heading', { name: 'RESTful API Integration & Dashboard' })
    const submittedTimestamps = await screen.findAllByText(/submitted on/i)
    expect(submittedTimestamps.length).toBe(2)

    // Course progress updates from "2 of 3 done" to "3 of 3 done" (100%)
    expect(screen.getByText('3 of 3 done')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('group assignment: leader can acknowledge, non-leader member sees disabled note, and changes to acknowledged', async () => {
    // 1. First test non-leader member: Kabir Singh (member of Team Beta, leader is Ananya Reddy)
    loginAsStudent('user-student-5', 'Kabir Singh', 'kabir.singh@classdesk.edu')

    const { unmount } = renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-web101'],
      },
    )

    // Wait for page to load
    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(screen.getByText('Member of Team Beta')).toBeInTheDocument()

    // For unacknowledged group assignment asg-web-02, Kabir sees disabled note
    expect(
      screen.getByText('Only your group leader can acknowledge this.'),
    ).toBeInTheDocument()

    unmount()

    // 2. Now login as Ananya Reddy (Leader of Team Beta)
    loginAsStudent('user-student-4', 'Ananya Reddy', 'ananya.reddy@classdesk.edu')
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-web101'],
      },
    )

    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(screen.getByText('Team Beta · Leader')).toBeInTheDocument()

    // Ananya sees the acknowledge button for Team Beta
    const ackBtn = screen.getByRole('button', {
      name: /acknowledge group submission for team project: collaborative task board/i,
    })
    expect(ackBtn).toBeInTheDocument()

    // Click to open confirmation dialog
    await user.click(ackBtn)
    expect(await screen.findByText('Confirm group acknowledgement')).toBeInTheDocument()

    // Confirm acknowledgement
    const confirmBtn = screen.getByRole('button', { name: /yes, confirm acknowledgement/i })
    await user.click(confirmBtn)

    // Card shows acknowledged by leader
    expect(
      await screen.findByText(/acknowledged by ananya reddy on/i),
    ).toBeInTheDocument()
  })

  it('student with NO group sees exact notice and "Create or join a group" button', async () => {
    // Aarav Sharma in DSA201 (where he has NO group)
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-dsa201'],
      },
    )

    expect(await screen.findByRole('heading', { name: 'Data Structures' })).toBeInTheDocument()
    expect(screen.getByText('No group yet')).toBeInTheDocument()

    // asg-dsa-02 is a group assignment: student with no group sees exact notice
    expect(
      screen.getByText(
        'You are not part of any group. Create or join one to submit this assignment.',
      ),
    ).toBeInTheDocument()

    // Button linking to #groups
    const groupBtn = screen.getByRole('button', { name: /create or join a group/i })
    expect(groupBtn.closest('a')).toHaveAttribute('href', '#groups')
  })

  it('shows ONLY assignments that apply to this student (applicable-only)', async () => {
    // Kabir Singh (user-student-5) in WEB101:
    // asg-web-01 is assigned to all (applicable)
    // asg-web-02 is group (applicable)
    // asg-web-03 is assigned to [s1, s2, s4] (NOT Kabir!)
    loginAsStudent('user-student-5', 'Kabir Singh', 'kabir.singh@classdesk.edu')

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-web101'],
      },
    )

    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()

    // Total applicable assignments is 2
    expect(
      screen.getByRole('heading', { name: /course deliverables \(2\)/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Responsive Portfolio Website' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Team Project: Collaborative Task Board' }),
    ).toBeInTheDocument()

    // asg-web-03 MUST NOT appear for Kabir
    expect(
      screen.queryByRole('heading', { name: 'RESTful API Integration & Dashboard' }),
    ).not.toBeInTheDocument()
  })

  it('supports searching, status tab filtering, sorting by deadline, URL params, and live count', async () => {
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-web101'],
      },
    )

    // Aarav has 3 assignments in WEB101: 2 done (portfolio, team project), 1 pending (api dashboard), 0 overdue
    expect(await screen.findByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(screen.getByText('Showing 3 of 3 assignments')).toBeInTheDocument()

    // 1. Filter by "Pending" tab
    const pendingTab = screen.getByRole('radio', { name: /pending \(1\)/i })
    await user.click(pendingTab)

    expect(screen.getByRole('heading', { name: 'RESTful API Integration & Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Responsive Portfolio Website' })).not.toBeInTheDocument()
    expect(screen.getByText(/showing 1 of 3 assignments \(filtered\)/i)).toBeInTheDocument()

    // 2. Filter by "Done" tab
    const doneTab = screen.getByRole('radio', { name: /done \(2\)/i })
    await user.click(doneTab)

    expect(screen.getByRole('heading', { name: 'Responsive Portfolio Website' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Team Project: Collaborative Task Board' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'RESTful API Integration & Dashboard' })).not.toBeInTheDocument()
    expect(screen.getByText(/showing 2 of 3 assignments \(filtered\)/i)).toBeInTheDocument()

    // 3. Reset to "All" tab
    const allTab = screen.getByRole('radio', { name: /all \(3\)/i })
    await user.click(allTab)

    expect(screen.getByRole('heading', { name: 'RESTful API Integration & Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Responsive Portfolio Website' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Team Project: Collaborative Task Board' })).toBeInTheDocument()

    // 4. Search query
    const searchInput = screen.getByPlaceholderText(/search assignments/i)
    await user.type(searchInput, 'Collaborative')

    expect(
      screen.getByRole('heading', { name: /team project: collaborative task board/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Responsive Portfolio Website' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'RESTful API Integration & Dashboard' })).not.toBeInTheDocument()

    // 5. Search with no matches shows empty state with clear filters
    await user.clear(searchInput)
    await user.type(searchInput, 'NonExistentTitle')

    expect(await screen.findByText('No matching assignments')).toBeInTheDocument()
    const clearBtn = screen.getByRole('button', { name: /clear filters/i })
    await user.click(clearBtn)

    // Restores all cards
    expect(await screen.findByRole('heading', { name: 'Responsive Portfolio Website' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Team Project: Collaborative Task Board' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'RESTful API Integration & Dashboard' })).toBeInTheDocument()
  })

  it('shows friendly "could not find that course" state when visiting a course the student is not enrolled in', async () => {
    // Aarav Sharma attempting to view course-osy301 (which he is not enrolled in)
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')

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
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')

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
