import { BrowserRouter, Route, Routes } from 'react-router-dom'
import {
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
  RootRedirect,
} from '@/app/guards'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { StudentDashboardPage } from '@/features/student/StudentDashboardPage'
import { StudentCalendarPage } from '@/features/student/StudentCalendarPage'
import { AdminAssignmentsPage } from '@/features/admin/AdminAssignmentsPage'
import { AssignmentDetailPage } from '@/features/admin/AssignmentDetailPage'
import { AdminCalendarPage } from '@/features/admin/AdminCalendarPage'
import { NotFoundPage } from '@/features/common/NotFoundPage'
import { UiGallery } from '@/features/dev/UiGallery'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Public Register Route */}
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* Student App Shell & Routes */}
        <Route
          path="/student"
          element={
            <RequireAuth>
              <RequireRole role="student">
                <AppShell />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<StudentDashboardPage />} />
          <Route path="calendar" element={<StudentCalendarPage />} />
        </Route>

        {/* Admin App Shell & Routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireRole role="admin">
                <AppShell />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<AdminAssignmentsPage />} />
          <Route path="assignments/:assignmentId" element={<AssignmentDetailPage />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
        </Route>

        {/* Developer UI Component Gallery (Dev mode only) */}
        {import.meta.env.DEV && (
          <Route path="/dev/gallery" element={<UiGallery />} />
        )}

        {/* Catch-all Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
