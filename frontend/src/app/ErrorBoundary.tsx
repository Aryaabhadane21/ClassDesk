import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ClassDesk ErrorBoundary caught uncaught error]:', error, errorInfo)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-app text-fg flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md p-8 rounded-lg bg-surface border border-line shadow-card text-center space-y-6">
            <div className="flex justify-center">
              <Logo size="md" />
            </div>

            <div className="w-12 h-12 rounded-pill bg-danger-soft text-danger mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
                Something went wrong
              </h1>
              <p className="text-sm text-muted leading-relaxed">
                An unexpected error occurred while rendering this page.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-md bg-surface-2 border border-line text-left overflow-x-auto text-xs font-mono text-muted">
                {this.state.error.message}
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={this.handleReload}
              className="w-full justify-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
              Reload page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
