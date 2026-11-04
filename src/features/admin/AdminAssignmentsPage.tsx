import { useState, useRef } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SkeletonCard,
  useToast,
} from '@/components/ui'
import { AdminAssignmentCard } from '@/components/assignments/AdminAssignmentCard'
import { AssignmentFormModal } from '@/features/admin/AssignmentFormModal'
import { useAdminAssignments } from '@/features/admin/useAdminAssignments'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getGreetingName } from '@/utils/names'
import { mockApi } from '@/services/mockApi'
import type { AdminAssignment } from '@/types'

export function AdminAssignmentsPage() {
  const { user } = useAuth()
  const { success } = useToast()
  usePageTitle('Assignments')

  const adminId = user?.id || ''
  const greetingName = getGreetingName(user?.name)
  const newAssignmentBtnRef = useRef<HTMLButtonElement>(null)

  const {
    assignments,
    students,
    status,
    error,
    reload,
    addAssignment,
    replaceAssignment,
    removeAssignment,
  } = useAdminAssignments()

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AdminAssignment | null>(null)

  // Delete dialog state
  const [deletingAssignment, setDeletingAssignment] = useState<AdminAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleOpenCreate = () => {
    setEditingAssignment(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (assignment: AdminAssignment) => {
    setEditingAssignment(assignment)
    setIsFormModalOpen(true)
  }

  const handleOpenDelete = (assignment: AdminAssignment) => {
    setDeletingAssignment(assignment)
    setDeleteError(null)
  }

  const handleCloseDelete = () => {
    if (isDeleting) return
    setDeletingAssignment(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingAssignment) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await mockApi.deleteAssignment(adminId, deletingAssignment.id)
      removeAssignment(deletingAssignment.id)
      success('Assignment deleted')
      setDeletingAssignment(null)

      // Move focus to the "New assignment" button after deletion
      setTimeout(() => {
        newAssignmentBtnRef.current?.focus()
      }, 50)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to delete assignment. Please try again.'
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFormSuccess = (saved: AdminAssignment) => {
    if (editingAssignment) {
      replaceAssignment(saved)
    } else {
      addAssignment(saved)
    }

    // Shift focus to the created/updated card
    setTimeout(() => {
      const cardEl = document.getElementById(`admin-assignment-card-${saved.id}`)
      cardEl?.focus()
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Your assignments"
        description={`Signed in as ${greetingName} • ${assignments.length} ${
          assignments.length === 1 ? 'assignment' : 'assignments'
        }`}
        actions={
          <Button
            ref={newAssignmentBtnRef}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
            aria-label="Create new assignment"
          >
            New assignment
          </Button>
        }
      />

      {/* 2. Summary Subheader */}
      {status === 'success' && assignments.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted font-medium pb-2 border-b border-line">
          <span>
            {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
          </span>
          <span>Cohort of {students.length} students</span>
        </div>
      )}

      {/* 3. Loading State */}
      {status === 'loading' && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 animate-fade-in"
          aria-busy="true"
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* 4. Error State */}
      {status === 'error' && (
        <ErrorState
          title="Could not load assignments"
          message={error || 'An unexpected error occurred while loading assignments.'}
          onRetry={reload}
          retryLabel="Try again"
        />
      )}

      {/* 5. Empty State */}
      {status === 'success' && assignments.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6 text-accent" />}
          title="No assignments yet"
          description="You haven't created any assignments yet. Add your first assignment to share deliverables and track student progress."
          action={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              Create your first assignment
            </Button>
          }
        />
      )}

      {/* 6. Assignment Cards Grid */}
      {status === 'success' && assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <AdminAssignmentCard
              key={assignment.id}
              assignment={assignment}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* 7. Create / Edit Assignment Modal */}
      <AssignmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialAssignment={editingAssignment}
        students={students}
        adminId={adminId}
        onSuccess={handleFormSuccess}
      />

      {/* 8. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAssignment)}
        onCancel={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Delete this assignment?"
        tone="danger"
        confirmLabel="Delete assignment"
        cancelLabel="Keep assignment"
        loading={isDeleting}
        errorContent={
          deleteError ? (
            <p className="text-xs text-danger font-medium">{deleteError}</p>
          ) : undefined
        }
        message={
          deletingAssignment ? (
            <span>
              Are you sure you want to permanently delete{' '}
              <strong className="text-fg font-semibold">
                &ldquo;{deletingAssignment.title}&rdquo;
              </strong>
              ? All {deletingAssignment.submittedCount} student submission{' '}
              {deletingAssignment.submittedCount === 1 ? 'record' : 'records'}{' '}
              for this assignment will also be permanently deleted. This action
              cannot be undone.
            </span>
          ) : (
            ''
          )
        }
      />
    </div>
  )
}
