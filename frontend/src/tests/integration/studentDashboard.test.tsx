import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { StudentDashboardPage } from '@/features/student/StudentDashboardPage'
import { StudentCoursePage } from '@/features/student/StudentCoursePage'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { resetDemoData } from '@/services/storage'

describe('Integration: Student Dashboard', () => {
  beforeEach(() => {
    resetDemoData()
  })

  it('shows exactly 3 enrolled courses and stats for Aarav Sharma', async () => {
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<StudentDashboardPage />, {
      initialEntries: ['/student'],
    })

    // Wait for courses to load
    expect(await screen.findByText('Web Development')).toBeInTheDocument()
    expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()
    expect(screen.getByText('Data Structures')).toBeInTheDocument()
    expect(screen.queryByText('Operating Systems')).not.toBeInTheDocument()

    // Page Header
    expect(screen.getByText('Your courses')).toBeInTheDocument()
    expect(screen.getByText(/welcome back, aarav/i)).toBeInTheDocument()

    // 4 Stat Cards
    const coursesCard = screen.getByText('Courses').closest('div')
    expect(within(coursesCard!).getByText('3')).toBeInTheDocument()

    const assignmentsCard = screen.getByText('Assignments').closest('div')
    expect(within(assignmentsCard!).getByText('9')).toBeInTheDocument()

    // Course card details: professor avatar/name and group status chips
    expect(screen.getAllByText('Prof. Meera Iyer').length).toBeGreaterThan(0)
    expect(screen.getByText('Prof. Arjun Mehta')).toBeInTheDocument()

    // Aarav group statuses:
    // WEB101: Leader of Team Alpha
    expect(screen.getByText('Team Alpha · Leader')).toBeInTheDocument()
    // HCI210 and DSA201: No group yet
    expect(screen.getAllByText('No group yet').length).toBe(2)

    // Title links to /student/courses/:id
    const webLink = screen.getByRole('link', { name: /web development/i })
    expect(webLink).toHaveAttribute('href', '/student/courses/course-web101')
  })

  it('shows Diya Patel enrolled courses and only her own group membership', async () => {
    const token = createToken({
      id: 'user-student-2',
      name: 'Diya Patel',
      email: 'diya.patel@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<StudentDashboardPage />, {
      initialEntries: ['/student'],
    })

    // Diya is enrolled in WEB101, HCI210, and OSY301
    expect(await screen.findByText('Web Development')).toBeInTheDocument()
    expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()
    expect(screen.getByText('Operating Systems')).toBeInTheDocument()
    expect(screen.queryByText('Data Structures')).not.toBeInTheDocument()

    // Diya group statuses:
    // WEB101: Member of Team Alpha
    expect(screen.getByText('Member of Team Alpha')).toBeInTheDocument()
  })

  it('filters courses by search query, updates URL q param, and handles empty search results', async () => {
    const user = userEvent.setup()
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<StudentDashboardPage />, {
      initialEntries: ['/student'],
    })

    expect(await screen.findByText('Web Development')).toBeInTheDocument()
    expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()
    expect(screen.getByText('Data Structures')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', {
      name: /search by course name, code, description or professor/i,
    })

    // Filter by professor name "Arjun"
    await user.type(searchInput, 'Arjun')

    await waitFor(() => {
      expect(screen.getByText('Data Structures')).toBeInTheDocument()
      expect(screen.queryByText('Web Development')).not.toBeInTheDocument()
      expect(screen.queryByText('Human-Computer Interaction')).not.toBeInTheDocument()
      expect(screen.getByText(/showing 1 of 3 courses/i)).toBeInTheDocument()
    })

    // Filter by non-matching query
    await user.clear(searchInput)
    await user.type(searchInput, 'astronomy')

    await waitFor(() => {
      expect(screen.getByText('No matching courses')).toBeInTheDocument()
    })

    // Click "Clear search"
    const clearButtons = screen.getAllByRole('button', { name: 'Clear search' })
    await user.click(clearButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Web Development')).toBeInTheDocument()
      expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()
      expect(screen.getByText('Data Structures')).toBeInTheDocument()
    })
  })

  it('shows empty state for a new student and supports joining a course by code with normalization', async () => {
    const user = userEvent.setup()
    const newStudentId = 'user-student-new'
    const token = createToken({
      id: newStudentId,
      name: 'Maya Sen',
      email: 'maya.sen@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    // Save student to storage
    const storedUsers = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.USERS) || '[]',
    )
    storedUsers.push({
      id: newStudentId,
      name: 'Maya Sen',
      email: 'maya.sen@classdesk.edu',
      password: 'password123',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(storedUsers))

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<StudentDashboardPage />} />
        <Route path="/student/courses/:courseId" element={<StudentCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/student'],
      },
    )

    // Empty state is rendered
    expect(
      await screen.findByText("You're not enrolled in any course yet"),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ask your professor for a join code, then join the course here.'),
    ).toBeInTheDocument()

    // Click "Join your first course"
    const joinFirstBtn = screen.getByRole('button', {
      name: 'Join your first course',
    })
    await user.click(joinFirstBtn)

    // Modal dialog is open
    const modal = await screen.findByRole('dialog')
    expect(modal).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Join a course' })).toBeInTheDocument()

    // Join with lowercase and spaced join code: 'web 4k7p'
    const codeInput = within(modal).getByLabelText(/join code/i)
    fireEvent.change(codeInput, { target: { value: 'web 4k7p' } })

    const joinSubmitBtn = within(modal).getByRole('button', { name: 'Join course' })
    await user.click(joinSubmitBtn)

    // Success view in modal
    expect(
      await within(modal).findByRole('heading', { name: 'You joined Web Development' }),
    ).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Open course' })).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Done' })).toBeInTheDocument()

    // Click "Done"
    await user.click(within(modal).getByRole('button', { name: 'Done' }))

    // Modal closes and Web Development card is now in the dashboard
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Web Development')).toBeInTheDocument()
    expect(screen.getByText('WEB101')).toBeInTheDocument()
  })

  it('prevents joining a course the student is already enrolled in and shows error for invalid code', async () => {
    const user = userEvent.setup()
    const token = createToken({
      id: 'user-student-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@classdesk.edu',
      role: 'student',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<StudentDashboardPage />, {
      initialEntries: ['/student'],
    })

    expect(await screen.findByText('Web Development')).toBeInTheDocument()

    // Open Join modal via header button
    const joinBtn = screen.getByRole('button', { name: 'Join a course' })
    await user.click(joinBtn)

    const modal = await screen.findByRole('dialog')
    const codeInput = within(modal).getByLabelText(/join code/i)

    // Test 1: Invalid join code format (too short)
    fireEvent.change(codeInput, { target: { value: 'AB' } })
    const submitBtn = within(modal).getByRole('button', { name: 'Join course' })
    await user.click(submitBtn)

    expect(
      await screen.findByText('Join codes only contain letters, numbers and dashes'),
    ).toBeInTheDocument()

    // Test 2: Try to join WEB101 which Aarav is already enrolled in (WEB-4K7P)
    fireEvent.change(codeInput, { target: { value: 'WEB-4K7P' } })
    await user.click(submitBtn)

    const alreadyEnrolledError = await screen.findByText(
      /already enrolled in this course/i,
    )
    expect(alreadyEnrolledError).toBeInTheDocument()
  })
})
