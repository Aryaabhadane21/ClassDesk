import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { AppShell } from '@/components/layout/AppShell'
import { StudentCoursePage } from '@/features/student/StudentCoursePage'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'
import { resetDemoData } from '@/services/storage'

describe('Integration: Student Course Groups Section', () => {
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

  it('student with no group creates a new group and becomes the leader; assignment cards update in place', async () => {
    // Aarav Sharma in DSA201 (initially has NO group)
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')
    const user = userEvent.setup()

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

    // Group assignment asg-dsa-02 initially shows "You are not part of any group..."
    expect(
      screen.getByText(
        'You are not part of any group. Create or join one to submit this assignment.',
      ),
    ).toBeInTheDocument()

    // 1. Open "Create a group" modal using exact button name
    const createBtn = screen.getByRole('button', { name: /^create a group$/i })
    await user.click(createBtn)

    const modal = await screen.findByRole('dialog')
    expect(modal).toBeInTheDocument()
    expect(within(modal).getByRole('heading', { name: 'Create a group' })).toBeInTheDocument()

    // 2. Fill and submit new group name
    const nameInput = within(modal).getByLabelText(/group name/i)
    fireEvent.change(nameInput, { target: { value: 'Algorithm Avengers' } })

    const submitBtn = within(modal).getByRole('button', { name: /^create group$/i })
    await user.click(submitBtn)

    // 3. Modal closes; Aarav is now leader of Algorithm Avengers
    expect(await screen.findByText('Algorithm Avengers')).toBeInTheDocument()
    expect(screen.getByText('You are the Leader')).toBeInTheDocument()
    expect(screen.getByText('Algorithm Avengers · Leader')).toBeInTheDocument()

    // 4. Assignment cards update in place:
    // asg-dsa-02 now shows leader acknowledge button ("Yes, I have submitted")
    expect(
      screen.queryByText(
        'You are not part of any group. Create or join one to submit this assignment.',
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /acknowledge group submission for distributed cache & hash ring system/i,
      }),
    ).toBeInTheDocument()
  })

  it('student with no group joins an existing group; assignment cards update in place with member view', async () => {
    // Aarav Sharma in DSA201 (no group; "Pointer Pals" exists in DSA201 with leader Rohan Gupta)
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')
    const user = userEvent.setup()

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

    // Pointer Pals exists in available groups
    expect(screen.getByRole('heading', { name: 'Pointer Pals' })).toBeInTheDocument()
    expect(screen.getByText(/leader: rohan gupta/i)).toBeInTheDocument()

    // Click "Join group" on Pointer Pals
    const joinBtn = screen.getByRole('button', { name: /join group pointer pals/i })
    await user.click(joinBtn)

    // Now Aarav is a member of Pointer Pals
    expect(await screen.findByText('Member of Pointer Pals')).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()

    // GroupPanel lists members including Aarav with "You" marker
    const groupsSection = document.getElementById('groups')!
    expect(within(groupsSection).getByText('Aarav Sharma')).toBeInTheDocument()
    expect(within(groupsSection).getByText('You')).toBeInTheDocument()

    // Assignment cards update in place:
    // Because Aarav is a non-leader member and asg-dsa-02 is not yet acknowledged, shows disabled note
    expect(
      await screen.findByText('Only your group leader can acknowledge this.'),
    ).toBeInTheDocument()
  })

  it('enforces one-group rule and validates duplicate group name', async () => {
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')
    const user = userEvent.setup()

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

    // 1. Open create modal
    const createBtn = screen.getByRole('button', { name: /^create a group$/i })
    await user.click(createBtn)

    const modal = await screen.findByRole('dialog')
    const nameInput = within(modal).getByLabelText(/group name/i)
    const submitBtn = within(modal).getByRole('button', { name: /^create group$/i })

    // 2. Duplicate group name ("Pointer Pals" already exists in DSA201)
    fireEvent.change(nameInput, { target: { value: 'Pointer Pals' } })
    await user.click(submitBtn)

    expect(
      await within(modal).findByText('That group name is already taken in this course'),
    ).toBeInTheDocument()

    // 3. Clear and test valid creation
    fireEvent.change(nameInput, { target: { value: 'Dynamic Duo' } })
    await user.click(submitBtn)

    // Once in a group, one-group rule is enforced: no "Create a group" or "Join group" buttons exist
    expect(await screen.findByText('Dynamic Duo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /join group/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^create a group$/i })).not.toBeInTheDocument()
  })

  it('member list in GroupPanel renders leader with Crown icon, member avatars, and "You" marker', async () => {
    // Diya Patel viewing WEB101 (where she is a member of Team Alpha, leader is Aarav Sharma)
    loginAsStudent('user-student-2', 'Diya Patel', 'diya.patel@classdesk.edu')

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

    const groupsSection = document.getElementById('groups')!
    expect(within(groupsSection).getByText('Team Alpha')).toBeInTheDocument()
    expect(within(groupsSection).getByText('Group Members (3)')).toBeInTheDocument()

    // Leader info appears in leader card and members grid
    expect(within(groupsSection).getAllByText('Aarav Sharma').length).toBe(2)
    expect(within(groupsSection).getAllByText('Leader').length).toBeGreaterThanOrEqual(1)

    // All members present: Aarav, Diya, Rohan
    expect(within(groupsSection).getByText('Diya Patel')).toBeInTheDocument()
    expect(within(groupsSection).getByText('Rohan Gupta')).toBeInTheDocument()

    // "You" marker for Diya Patel
    expect(within(groupsSection).getByText('You')).toBeInTheDocument()
  })

  it('wires the "Create or join a group" button to scroll to and focus the #groups section', async () => {
    loginAsStudent('user-student-1', 'Aarav Sharma', 'aarav.sharma@classdesk.edu')
    const user = userEvent.setup()

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

    const groupsSection = document.getElementById('groups')!
    const scrollIntoViewMock = vi.fn()
    groupsSection.scrollIntoView = scrollIntoViewMock

    // Click "Create or join a group" on the group assignment card
    const cardGroupBtn = screen.getByRole('button', { name: /create or join a group/i })
    await user.click(cardGroupBtn)

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
    expect(document.activeElement).toBe(groupsSection)
  })

  it('renders empty state "No groups yet, be the first to create one" when course has 0 groups', async () => {
    // Diya Patel in HCI210 (initially has 0 groups in seed data)
    loginAsStudent('user-student-2', 'Diya Patel', 'diya.patel@classdesk.edu')

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<AppShell />}>
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/student/courses/course-hci210'],
      },
    )

    expect(
      await screen.findByRole('heading', { name: 'Human-Computer Interaction' }),
    ).toBeInTheDocument()

    // Empty state with exact title
    expect(
      screen.getByText('No groups yet, be the first to create one'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Create a group so your classmates can team up with you for course assignments.'),
    ).toBeInTheDocument()
  })
})
