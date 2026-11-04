import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from '@/components/ui/Dropdown'

describe('Unit: Dropdown component', () => {
  const options = [
    { label: 'Soonest due', value: 'due_asc' },
    { label: 'Furthest due', value: 'due_desc' },
    { label: 'Newest created', value: 'newest' },
  ]

  it('renders trigger with current selected option label', () => {
    render(
      <Dropdown
        label="Sort by"
        prefix="Sort:"
        value="due_asc"
        options={options}
        onChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', { name: /sort by/i })
    expect(trigger).toHaveTextContent('Sort: Soonest due')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('opens listbox on click and allows selecting an option', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <Dropdown
        label="Sort by"
        prefix="Sort:"
        value="due_asc"
        options={options}
        onChange={handleChange}
      />,
    )

    const trigger = screen.getByRole('button', { name: /sort by/i })
    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()

    const option = screen.getByRole('option', { name: /furthest due/i })
    await user.click(option)

    expect(handleChange).toHaveBeenCalledWith('due_desc')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navigates with keyboard and closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown
        label="Sort by"
        prefix="Sort:"
        value="due_asc"
        options={options}
        onChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', { name: /sort by/i })
    trigger.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
