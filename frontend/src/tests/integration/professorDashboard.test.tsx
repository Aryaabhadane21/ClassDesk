import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { ProfessorDashboardPage } from '@/features/admin/ProfessorDashboardPage'
import { ProfessorCoursePage } from '@/features/admin/ProfessorCoursePage'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { resetDemoData } from '@/services/storage'

describe('Integration: Professor Dashboard', () => {
  beforeEach(() => {
    resetDemoData()
  })

  it('shows exactly 2 seeded courses and overview stats for Prof. Meera Iyer', async () => {
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<ProfessorDashboardPage />, {
      initialEntries: ['/admin'],
    })

    // Wait for courses to load first
    expect(await screen.findByText('Web Development')).toBeInTheDocument()
    expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()
    expect(screen.queryByText('Data Structures')).not.toBeInTheDocument()
    expect(screen.queryByText('Operating Systems')).not.toBeInTheDocument()

    // Page Header Greeting
    expect(screen.getByText('Your courses')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, Prof. Meera')).toBeInTheDocument()

    // 4 Stat Cards: Meera's aggregate stats: 2 courses, 8 students enrolled, 5 assignments, 3 groups
    const coursesCard = screen.getByText('Courses').closest('div')
    expect(within(coursesCard!).getByText('2')).toBeInTheDocument()

    const studentsCard = screen.getByText('Students enrolled').closest('div')
    expect(within(studentsCard!).getByText('8')).toBeInTheDocument()

    const assignmentsCard = screen.getByText('Assignments').closest('div')
    expect(within(assignmentsCard!).getByText('6')).toBeInTheDocument()

    const groupsCard = screen.getByText('Groups').closest('div')
    expect(within(groupsCard!).getByText('2')).toBeInTheDocument()

    // Course card details: badges, metric chips, join codes
    expect(screen.getByText('WEB101')).toBeInTheDocument()
    expect(screen.getByText('HCI210')).toBeInTheDocument()
    expect(screen.getByText('WEB-4K7P')).toBeInTheDocument()
    expect(screen.getByText('HCI-9M2X')).toBeInTheDocument()

    // Title links to /admin/courses/:id
    const webLink = screen.getByRole('link', { name: /web development/i })
    expect(webLink).toHaveAttribute('href', '/admin/courses/course-web101')
  })

  it('shows exactly 2 seeded courses and overview stats for Prof. Arjun Mehta', async () => {
    const token = createToken({
      id: 'user-admin-2',
      name: 'Prof. Arjun Mehta',
      email: 'arjun.mehta@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<ProfessorDashboardPage />, {
      initialEntries: ['/admin'],
    })

    // Wait for Arjun's courses to load
    expect(await screen.findByText('Data Structures')).toBeInTheDocument()
    expect(screen.getByText('Operating Systems')).toBeInTheDocument()
    expect(screen.queryByText('Web Development')).not.toBeInTheDocument()
    expect(screen.queryByText('Human-Computer Interaction')).not.toBeInTheDocument()

    expect(screen.getByText('Welcome back, Prof. Arjun')).toBeInTheDocument()

    // Arjun's aggregate stats: 2 courses, 6 students enrolled, 5 assignments, 3 groups
    const studentsCard = screen.getByText('Students enrolled').closest('div')
    expect(within(studentsCard!).getByText('6')).toBeInTheDocument()
  })

  it('filters courses by search query, updates URL q param, and handles empty search results', async () => {
    const user = userEvent.setup()
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<ProfessorDashboardPage />, {
      initialEntries: ['/admin'],
    })

    expect(await screen.findByText('Web Development')).toBeInTheDocument()
    expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', {
      name: /search courses by name, code or description/i,
    })

    // Filter by "interaction"
    await user.type(searchInput, 'interaction')

    await waitFor(() => {
      expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()
      expect(screen.queryByText('Web Development')).not.toBeInTheDocument()
      expect(screen.getByText(/showing 1 of 2 courses/i)).toBeInTheDocument()
    })

    // Filter by non-matching query
    await user.clear(searchInput)
    await user.type(searchInput, 'quantum')

    await waitFor(() => {
      expect(screen.getByText('No matching courses')).toBeInTheDocument()
    })

    // Click "Clear search"
    const clearButtons = screen.getAllByRole('button', { name: 'Clear search' })
    await user.click(clearButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Web Development')).toBeInTheDocument()
      expect(screen.getByText('Human-Computer Interaction')).toBeInTheDocument()
    })
  })

  it('shows empty state for a new professor and supports the create course flow with validation and duplicate prevention', async () => {
    const user = userEvent.setup()
    const newProfId = 'user-prof-new'
    const token = createToken({
      id: newProfId,
      name: 'Prof. Sarah Jenkins',
      email: 'sarah.jenkins@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    // Also insert user into storage so mockApi recognizes it
    const storedUsers = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.USERS) || '[]',
    )
    storedUsers.push({
      id: newProfId,
      name: 'Prof. Sarah Jenkins',
      email: 'sarah.jenkins@classdesk.edu',
      password: 'password123',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(storedUsers))

    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<ProfessorDashboardPage />} />
        <Route path="/admin/courses/:courseId" element={<ProfessorCoursePage />} />
      </Routes>,
      {
        initialEntries: ['/admin'],
      },
    )

    // Empty state is rendered
    expect(
      await screen.findByText("You haven't created any courses yet"),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Create a course, then share its join code with your students.'),
    ).toBeInTheDocument()

    // Click "Create your first course"
    const createFirstBtn = screen.getByRole('button', {
      name: 'Create your first course',
    })
    await user.click(createFirstBtn)

    // Modal dialog is open
    const modal = await screen.findByRole('dialog')
    expect(modal).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New course' })).toBeInTheDocument()

    // Test 1: Empty submit triggers validation errors
    const submitBtn = screen.getByRole('button', { name: 'Create course' })
    await user.click(submitBtn)

    expect(await screen.findByText('Course code is required')).toBeInTheDocument()
    expect(screen.getByText('Course name is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()

    // Fill fields
    const codeInput = within(modal).getByLabelText(/course code/i)
    const nameInput = within(modal).getByLabelText(/course name/i)
    const descInput = within(modal).getByLabelText(/^description/i)

    fireEvent.change(codeInput, { target: { value: 'BIO101' } })
    expect(codeInput).toHaveValue('BIO101')

    fireEvent.change(nameInput, { target: { value: 'Introduction to Biology' } })
    fireEvent.change(descInput, {
      target: { value: 'Exploration of cell structure, genetics, and ecology.' },
    })

    // Submit valid course
    const modalSubmitBtn = within(modal).getByRole('button', { name: 'Create course' })
    await user.click(modalSubmitBtn)

    // Success view in modal
    expect(await within(modal).findByRole('heading', { name: 'Course created' })).toBeInTheDocument()
    expect(
      within(modal).getByText('Share this join code with your students so they can enroll'),
    ).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Open course' })).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Done' })).toBeInTheDocument()

    // Click "Done"
    await user.click(within(modal).getByRole('button', { name: 'Done' }))

    // Modal is closed and newly created course card appears in dashboard!
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Introduction to Biology')).toBeInTheDocument()
    expect(screen.getByText('BIO101')).toBeInTheDocument()
  })

  it('prevents creating duplicate course code for the same professor', async () => {
    const user = userEvent.setup()
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<ProfessorDashboardPage />, {
      initialEntries: ['/admin'],
    })

    expect(await screen.findByText('Web Development')).toBeInTheDocument()

    // Open modal via header button
    const newCourseBtn = screen.getByRole('button', { name: 'New course' })
    await user.click(newCourseBtn)

    // Try to create another course with code WEB101 (already owned by Meera)
    const modal = await screen.findByRole('dialog')
    const codeInput = within(modal).getByLabelText(/course code/i)
    const nameInput = within(modal).getByLabelText(/course name/i)
    const descInput = within(modal).getByLabelText(/^description/i)

    fireEvent.change(codeInput, { target: { value: 'WEB101' } })
    fireEvent.change(nameInput, { target: { value: 'Another Web Dev Course' } })
    fireEvent.change(descInput, { target: { value: 'A duplicate course attempt.' } })

    const submitBtn = within(modal).getByRole('button', { name: 'Create course' })
    await user.click(submitBtn)

    // Shows duplicate code validation error
    const duplicateErrors = await screen.findAllByText(
      'You already have a course with code "WEB101"',
    )
    expect(duplicateErrors.length).toBeGreaterThan(0)
  })
})
