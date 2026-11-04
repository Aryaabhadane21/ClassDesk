import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui'
import { NotificationProvider } from '@/hooks/useNotifications'

export interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialEntries?: MemoryRouterProps['initialEntries']
}

export function AllTheProviders({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode
  initialEntries?: MemoryRouterProps['initialEntries']
}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: ExtendedRenderOptions,
) {
  const { initialEntries, ...renderOptions } = options || {}
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialEntries={initialEntries}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}
