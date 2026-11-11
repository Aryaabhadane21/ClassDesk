import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { AppShell } from '@/components/layout/AppShell'
import { ProfessorDashboardPage } from '@/features/admin/ProfessorDashboardPage'
import { ProfessorCoursePage } from '@/features/admin/ProfessorCoursePage'
import { RequireAuth, RequireRole } from '@/app/guards'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { getAssignments, getSubmissions, resetDemoData, setCourses } from '@/services/storage'

describe('Integration: Professor Course Page', () => {
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

  it('renders course header, join code, overview stats, and seeded WEB101 assignments', async () => {
    loginAsProfMeera()

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

    // Back to courses link
    const backLink = screen.getByRole('link', { name: /back to courses/i })
    expect(backLink).toHaveAttribute('href', '/admin')

    // Overview StatCards (5 students, 2 groups, 3 assignments, 2 overdue: asg-web-01 and asg-web-02)
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getAllByText('Assignments').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Overdue')).toBeInTheDocument()

    // Seeded assignments for WEB101:
    // asg-web-01: Individual, Overdue, All 5 students, 5 of 5 submitted
    // asg-web-02: Group, Overdue, All groups, 1 of 2 groups acknowledged
    // asg-web-03: Individual, 3 selected students, 2 of 3 students submitted
    expect(screen.getByText('Responsive Portfolio Website')).toBeInTheDocument()
    expect(screen.getByText('Team Project: Collaborative Task Board')).toBeInTheDocument()
    expect(screen.getByText('RESTful API Integration & Dashboard')).toBeInTheDocument()

    // Type Badges
    const individualBadges = screen.getAllByText('Individual')
    expect(individualBadges.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Group')).toBeInTheDocument()

    // Audience lines
    expect(screen.getByText('All 5 students')).toBeInTheDocument()
    expect(screen.getByText('3 selected students')).toBeInTheDocument()
    expect(screen.getByText('All groups')).toBeInTheDocument()

    // Tracking lines
    expect(screen.getByText('5 of 5 students submitted')).toBeInTheDocument()
    expect(screen.getByText('1 of 2 groups acknowledged')).toBeInTheDocument()
    expect(screen.getByText('2 of 3 students submitted')).toBeInTheDocument()

    // Open OneDrive links exist
    const driveLinks = screen.getAllByRole('link', { name: /open onedrive/i })
    expect(driveLinks.length).toBe(3)
    driveLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noreferrer')
      expect(link.getAttribute('rel')).toContain('noopener')
    })
  })

  it('validates empty inputs, past due dates for new assignments, invalid URLs, and warns for non-OneDrive URLs', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    // Open creation modal
    const newBtn = await screen.findByRole('button', { name: /new assignment/i })
    await user.click(newBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New assignment' })).toBeInTheDocument()

    // Try submitting with empty fields
    const createBtn = screen.getByRole('button', { name: /^create assignment$/i })
    await user.click(createBtn)

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()
    expect(screen.getByText('OneDrive link is required')).toBeInTheDocument()

    // Test past deadline
    const dueInput = screen.getByLabelText(/^deadline/i)
    await user.clear(dueInput)
    await user.type(dueInput, '2020-01-01T12:00')
    await user.click(createBtn)

    expect(await screen.findByText('Due date must be in the future')).toBeInTheDocument()

    // Test invalid OneDrive URL
    const linkInput = screen.getByLabelText(/^onedrive link/i)
    await user.type(linkInput, 'not-a-valid-url')
    await user.click(createBtn)

    expect(await screen.findByText('OneDrive link must be a valid http or https URL')).toBeInTheDocument()

    // Test non-OneDrive URL warning (valid URL, but not 1drv.ms/sharepoint)
    await user.clear(linkInput)
    await user.type(linkInput, 'https://example.com/homework')

    expect(
      await screen.findByText(/this doesn't look like a onedrive link/i),
    ).toBeInTheDocument()
  })

  it('creates an individual assignment assigned to ALL students', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    const newBtn = await screen.findByRole('button', { name: /new assignment/i })
    await user.click(newBtn)

    // Fill form
    await user.type(screen.getByLabelText(/^title/i), 'React Components Workshop')
    await user.type(
      screen.getByLabelText(/^description/i),
      'Build reusable React components using Tailwind CSS and TypeScript.',
    )
    const linkInput = screen.getByLabelText(/^onedrive link/i)
    await user.type(linkInput, 'https://1drv.ms/f/s!reactworkshop')

    // Submit
    await user.click(screen.getByRole('button', { name: /^create assignment$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // Card appears
    expect(await screen.findByText('React Components Workshop')).toBeInTheDocument()
    expect(screen.getByText('0 of 5 students submitted')).toBeInTheDocument()

    // Submissions created in storage for all 5 enrolled students
    const submissions = getSubmissions()
    const newAsg = getAssignments().find((a) => a.title === 'React Components Workshop')
    expect(newAsg).toBeDefined()
    expect(newAsg?.audience).toBe('all')
    expect(newAsg?.assignedTo.length).toBe(5)

    const asgSubmissions = submissions.filter((s) => s.assignmentId === newAsg?.id)
    expect(asgSubmissions.length).toBe(5)
  })

  it('creates an individual assignment assigned to SELECTED students', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    const newBtn = await screen.findByRole('button', { name: /new assignment/i })
    await user.click(newBtn)

    // Fill form
    await user.type(screen.getByLabelText(/^title/i), 'Advanced TypeScript Lab')
    await user.type(screen.getByLabelText(/^description/i), 'Generic constraints and conditional types.')
    const linkInput = screen.getByLabelText(/^onedrive link/i)
    await user.type(linkInput, 'https://1drv.ms/f/s!tslab')

    // Choose Selected students
    const selectedRadio = screen.getByRole('radio', { name: /selected students/i })
    await user.click(selectedRadio)

    // Select 2 students: Diya and Aarav
    const diyaCheckbox = screen.getByLabelText(/select diya patel/i)
    const aaravCheckbox = screen.getByLabelText(/select aarav sharma/i)
    await user.click(diyaCheckbox)
    await user.click(aaravCheckbox)

    // Submit
    await user.click(screen.getByRole('button', { name: /^create assignment$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // Card appears with 2 selected students
    expect(await screen.findByText('Advanced TypeScript Lab')).toBeInTheDocument()
    expect(screen.getByText('2 selected students')).toBeInTheDocument()
    expect(screen.getByText('0 of 2 students submitted')).toBeInTheDocument()

    // Submissions in storage exist ONLY for the 2 selected students
    const newAsg = getAssignments().find((a) => a.title === 'Advanced TypeScript Lab')
    expect(newAsg?.audience).toBe('selected')
    expect(newAsg?.assignedTo).toEqual(
      expect.arrayContaining(['user-student-1', 'user-student-2']),
    )
    const submissions = getSubmissions().filter((s) => s.assignmentId === newAsg?.id)
    expect(submissions.length).toBe(2)
  })

  it('creates a group assignment without student picker and shows group note', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    const newBtn = await screen.findByRole('button', { name: /new assignment/i })
    await user.click(newBtn)

    await user.type(screen.getByLabelText(/^title/i), 'Group Capstone Showcase')
    await user.type(screen.getByLabelText(/^description/i), 'Final presentation and peer review.')
    await user.type(screen.getByLabelText(/^onedrive link/i), 'https://1drv.ms/f/s!capstone')

    // Click "Group"
    const groupRadio = screen.getByRole('radio', { name: /group/i })
    await user.click(groupRadio)

    // Notice appears and student picker is not rendered
    expect(
      screen.getByText(/group assignments go to every group in this course/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/all enrolled students/i)).not.toBeInTheDocument()

    // Submit
    await user.click(screen.getByRole('button', { name: /^create assignment$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    expect(await screen.findByText('Group Capstone Showcase')).toBeInTheDocument()
    expect(screen.getByText('0 of 2 groups acknowledged')).toBeInTheDocument()
  })

  it('edits an assignment with prefilled data and warns when deselecting submitted students', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    // Edit asg-web-03 ("RESTful API Integration & Dashboard")
    // asg-web-03 has 2 submitted students: Diya Patel and Ananya Rao
    await screen.findByText('RESTful API Integration & Dashboard')
    const editBtn = screen.getByRole('button', {
      name: /edit.*restful/i,
    })
    await user.click(editBtn)

    // Dialog opens with "Edit assignment"
    expect(await screen.findByRole('heading', { name: 'Edit assignment' })).toBeInTheDocument()

    // Prefilled values
    const titleInput = screen.getByLabelText(/^title/i) as HTMLInputElement
    expect(titleInput.value).toBe('RESTful API Integration & Dashboard')

    // Submission type tiles are disabled because submissions exist
    const individualRadio = screen.getByRole('radio', { name: /individual/i })
    const groupRadio = screen.getByRole('radio', { name: /group/i })
    expect(individualRadio).toBeDisabled()
    expect(groupRadio).toBeDisabled()
    expect(
      screen.getByText(/submission type cannot be changed after submissions or acknowledgements have started/i),
    ).toBeInTheDocument()

    // Deselect Diya Patel (who has submitted)
    const diyaCheckbox = screen.getByLabelText(/select diya patel/i)
    await user.click(diyaCheckbox)

    // Warning note appears
    expect(
      await screen.findByText(/removing a student also removes their submission record for this assignment/i),
    ).toBeInTheDocument()

    // Edit title and save
    await user.clear(titleInput)
    await user.type(titleInput, 'Advanced RESTful Architecture')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // Updated card visible
    expect(await screen.findByText('Advanced RESTful Architecture')).toBeInTheDocument()
  })

  it('deletes an assignment through ConfirmDialog and updates list', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    await screen.findByText('Responsive Portfolio Website')
    const deleteBtn = screen.getByRole('button', {
      name: /delete.*responsive/i,
    })
    await user.click(deleteBtn)

    // Confirm dialog opens
    expect(await screen.findByRole('heading', { name: 'Delete assignment?' })).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure you want to delete/i),
    ).toBeInTheDocument()

    // Cancel first
    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i })
    await user.click(cancelBtn)

    expect(screen.queryByRole('heading', { name: 'Delete assignment?' })).not.toBeInTheDocument()
    expect(screen.getByText('Responsive Portfolio Website')).toBeInTheDocument()

    // Click delete again and confirm
    await user.click(deleteBtn)
    const confirmDeleteBtn = screen.getByRole('button', { name: /^delete assignment$/i })
    await user.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(
        screen.queryByText('Responsive Portfolio Website'),
      ).not.toBeInTheDocument()
    })

    // Assignment removed from storage
    const assignments = getAssignments()
    expect(assignments.some((a) => a.id === 'asg-web-01')).toBe(false)
  })

  it('searches and filters assignments by status and completion', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    await screen.findByText('Responsive Portfolio Website')

    // Search for "Task Board"
    const searchInput = screen.getByPlaceholderText(/search by title or description/i)
    await user.type(searchInput, 'Task Board')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /team project: collaborative task board/i }),
      ).toBeInTheDocument()
      expect(screen.queryByText(/responsive portfolio website/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/restful api integration/i)).not.toBeInTheDocument()
    })

    // Clear search
    const clearSearchBtn = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearSearchBtn)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /responsive portfolio website/i }),
      ).toBeInTheDocument()
    })

    // Filter by "Completed"
    const completeSegment = screen.getByRole('radio', { name: /^completed/i })
    await user.click(completeSegment)

    await waitFor(() => {
      // asg-web-01 is 5 of 5 submitted (100% complete)
      expect(
        screen.getByRole('heading', { name: /responsive portfolio website/i }),
      ).toBeInTheDocument()
      // asg-web-02 is 1 of 2 (incomplete)
      expect(screen.queryByText(/team project: collaborative task board/i)).not.toBeInTheDocument()
    })
  })

  it('handles empty state for course with zero assignments and empty search state', async () => {
    loginAsProfMeera()
    const user = userEvent.setup()

    // Add a course with 0 assignments
    const courses = [
      {
        id: 'course-empty-test',
        code: 'CS999',
        name: 'Empty Test Course',
        description: 'No assignments here yet.',
        semester: 'Autumn 2026',
        professorId: 'user-admin-1',
        joinCode: 'CS-9999',
        createdAt: new Date().toISOString(),
      },
    ]
    setCourses(courses)

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-empty-test'],
      },
    )

    // Empty state rendered
    expect(await screen.findByText('No assignments in this course yet')).toBeInTheDocument()
    const createFirstBtn = screen.getByRole('button', { name: /create the first assignment/i })
    expect(createFirstBtn).toBeInTheDocument()

    // Clicking it opens the modal
    await user.click(createFirstBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New assignment' })).toBeInTheDocument()
  })

  it('shows info note when course has group assignments but 0 groups', async () => {
    loginAsProfMeera()

    // In course-dsa201 (taught by Prof. Arjun Mehta), let's temporarily set professorId to user-admin-1
    // and remove its groups
    window.localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify([]))

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-web101'],
      },
    )

    // WEB101 has asg-web-02 (group assignment). With 0 groups, info line should appear
    expect(
      await screen.findByText(
        /students haven't created any groups yet\. students can form groups on their course page\./i,
      ),
    ).toBeInTheDocument()
  })

  it('protects unauthorized access: foreign professor sees 404, student redirected to /student', async () => {
    // 1. Prof. Meera Iyer attempting to view course-dsa201 (taught by Prof. Arjun Mehta)
    loginAsProfMeera()

    renderWithProviders(
      <Routes>
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin/courses/course-dsa201'],
      },
    )

    expect(await screen.findByText("We couldn't find that course")).toBeInTheDocument()

    // 2. Student visiting /admin route
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
  })
})
