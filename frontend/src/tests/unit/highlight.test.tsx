import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Highlight } from '@/components/ui/Highlight'

describe('Unit: Highlight component', () => {
  it('renders plain text when no query is provided', () => {
    render(<Highlight text="Introduction to Artificial Intelligence" />)
    expect(screen.getByText('Introduction to Artificial Intelligence')).toBeInTheDocument()
    expect(document.querySelector('mark')).toBeNull()
  })

  it('highlights matching substrings safely with <mark>', () => {
    render(<Highlight text="Build a REST API with Node" query="api" />)
    const mark = document.querySelector('mark')
    expect(mark).not.toBeNull()
    expect(mark?.textContent).toBe('API')
  })

  it('safely handles regex special characters in query without throwing', () => {
    render(<Highlight text="Equation (A + B) * C = D" query="(A + B)" />)
    const mark = document.querySelector('mark')
    expect(mark).not.toBeNull()
    expect(mark?.textContent).toBe('(A + B)')
  })
})
