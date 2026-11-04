import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssignmentToolbar } from '@/components/assignments/AssignmentToolbar'

describe('Integration: AssignmentToolbar', () => {
  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'To do', value: 'todo' },
    { label: 'Submitted', value: 'submitted' },
  ]

  const statusCounts = {
    all: 10,
    todo: 6,
    submitted: 4,
  }

  it('renders search, segmented control with counts, and dropdowns', () => {
    render(
      <AssignmentToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        statusValue="all"
        onStatusChange={vi.fn()}
        statusOptions={statusOptions}
        statusCounts={statusCounts}
        dueValue="all"
        onDueChange={vi.fn()}
        sortValue="due_asc"
        onSortChange={vi.fn()}
        hasActiveFilters={false}
        onClearFilters={vi.fn()}
        resultCount={10}
        totalCount={10}
      />,
    )

    expect(
      screen.getByPlaceholderText(/search by title or description/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /all 10/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /to do 6/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /submitted 4/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /due date/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sort by/i })).toBeInTheDocument()
  })

  it('allows clicking segmented control option to change status', async () => {
    const user = userEvent.setup()
    const handleStatusChange = vi.fn()

    render(
      <AssignmentToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        statusValue="all"
        onStatusChange={handleStatusChange}
        statusOptions={statusOptions}
        statusCounts={statusCounts}
        dueValue="all"
        onDueChange={vi.fn()}
        sortValue="due_asc"
        onSortChange={vi.fn()}
        hasActiveFilters={false}
        onClearFilters={vi.fn()}
        resultCount={10}
        totalCount={10}
      />,
    )

    const todoSegment = screen.getByRole('radio', { name: /to do 6/i })
    await user.click(todoSegment)

    expect(handleStatusChange).toHaveBeenCalledWith('todo')
  })

  it('renders removable chips and clear all button when filters are active', async () => {
    const user = userEvent.setup()
    const handleClearFilters = vi.fn()
    const handleSearchChange = vi.fn()

    render(
      <AssignmentToolbar
        searchQuery="quantum"
        onSearchChange={handleSearchChange}
        statusValue="todo"
        onStatusChange={vi.fn()}
        statusOptions={statusOptions}
        statusCounts={statusCounts}
        dueValue="overdue"
        onDueChange={vi.fn()}
        sortValue="due_asc"
        onSortChange={vi.fn()}
        hasActiveFilters={true}
        onClearFilters={handleClearFilters}
        resultCount={2}
        totalCount={10}
      />,
    )

    expect(screen.getByText(/search:/i)).toBeInTheDocument()
    expect(screen.getByText(/status:/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /remove filter: due date/i }),
    ).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearBtn)
    expect(handleClearFilters).toHaveBeenCalled()
  })
})
