/**
 * User roles supported across ClassDesk
 */
export type Role = 'student' | 'admin'

/**
 * Supported visual themes
 */
export type Theme = 'light' | 'dark'

/**
 * User account model
 */
export interface User {
  id: string
  name: string
  email: string
  /**
   * Plaintext password for mock/demo authentication only.
   * ClassDesk runs entirely in-browser without a backend.
   */
  password: string
  role: Role
}

/**
 * Course assignment created by an admin and assigned to students
 */
export interface Assignment {
  id: string
  title: string
  description: string
  /** ISO 8601 date string for the assignment deadline */
  dueDate: string
  /** Link to shared Google Drive / submission resources */
  driveLink: string
  /** Admin user ID who created the assignment */
  createdBy: string
  /** Array of student user IDs assigned to this task */
  assignedTo: string[]
  /** ISO 8601 timestamp of creation */
  createdAt: string
  /** ISO 8601 timestamp of last update */
  updatedAt: string
}

/**
 * Submission status options
 */
export type SubmissionStatus = 'submitted' | 'not_submitted'

/**
 * Student assignment submission record
 */
export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  status: SubmissionStatus
  /** ISO 8601 timestamp when submitted, or null if pending */
  submittedAt: string | null
}

/**
 * Trigger event types for notifications
 */
export type NotificationType = 'assigned' | 'due_soon' | 'overdue' | 'submitted'

/**
 * In-app notification record
 */
export interface AppNotification {
  id: string
  type: NotificationType
  assignmentId: string
  message: string
  /** ISO 8601 timestamp of notification creation */
  createdAt: string
  read: boolean
}
