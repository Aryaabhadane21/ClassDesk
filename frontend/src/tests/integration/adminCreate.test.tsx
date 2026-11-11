import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/tests/renderWithProviders'
import { AdminAssignmentsPage } from '@/features/admin/AdminAssignmentsPage'
import { STORAGE_KEYS } from '@/utils/constants'
import { createToken } from '@/services/auth/token'

describe('Integration: Admin Create Flow', () => {
  it('opens modal, validates required fields, and creates a new assignment', async () => {
    const user = userEvent.setup()

    // Sign in as Prof. Meera Iyer
    const token = createToken({
      id: 'user-admin-1',
      name: 'Prof. Meera Iyer',
      email: 'meera.iyer@classdesk.edu',
      role: 'admin',
    })
    window.localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    renderWithProviders(<AdminAssignmentsPage />, {
      initialEntries: ['/admin'],
    })

    // Click "New assignment"
    const newAsgBtn = await screen.findByRole('button', {
      name: /create new assignment/i,
    })
    await user.click(newAsgBtn)

    // Modal opens
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /^new assignment$/i }),
    ).toBeInTheDocument()

    // Submit with empty title & description
    const createBtn = screen.getByRole('button', {
      name: /^create assignment$/i,
    })
    await user.click(createBtn)

    // Validation errors appear
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/description is required/i)).toBeInTheDocument()

    // Fill valid data
    const titleInput = screen.getByLabelText(/^title/i)
    const descInput = screen.getByLabelText(/^description/i)
    const driveInput = screen.getByLabelText(/onedrive submission folder link/i)

    await user.type(titleInput, 'Microservices Architecture Design')
    await user.type(
      descInput,
      'Design modular microservices using Docker and gRPC protocols.',
    )
    await user.clear(driveInput)
    await user.type(driveInput, 'https://1drv.ms/f/s!microservices')

    // Submit valid form
    await user.click(createBtn)

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // New assignment appears on the dashboard
    expect(
      await screen.findByText('Microservices Architecture Design'),
    ).toBeInTheDocument()
  })
})
