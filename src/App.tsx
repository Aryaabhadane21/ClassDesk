import { AppRouter } from '@/app/router'
import { ErrorBoundary } from '@/app/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  )
}
