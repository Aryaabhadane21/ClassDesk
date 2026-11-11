/**
 * User roles supported across ClassDesk
 */
export type Role = 'student' | 'admin'

/**
 * Supported visual themes
 */
export type Theme = 'light' | 'dark'

/**
 * Assignment submission format
 */
export type SubmissionType = 'individual' | 'group'

/**
 * Course offering
 */
export interface Course {
  id: string
  code: string // e.g. "WEB101"
  name: string
  description: string
  semester: string // e.g. "Autumn 2026"
  professorId: string
  joinCode: string // unique, uppercase, readable e.g. "WEB-4K7P"
  createdAt: string
}

/**
 * Student course enrollment
 */
export interface Enrollment {
  courseId: string
  studentId: string
  enrolledAt: string
}

/**
 * Student group within a course
 */
export interface Group {
  id: string
  courseId: string
  name: string
  leaderId: string
  memberIds: string[] // Leader is always included in memberIds
  createdAt: string
}

/**
 * Group acknowledgement record for group assignments.
 * Model note:
 * - Individual assignments use the existing Submission records (one per student,
 *   with submittedAt as the acknowledgement timestamp).
 * - Group assignments use GroupAcknowledgement records (one per group, made by the leader)
 *   and have NO per-student Submission records.
 */
export interface GroupAcknowledgement {
  id: string
  assignmentId: string
  groupId: string
  leaderId: string
  acknowledgedAt: string
}

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
 * Safe user representation omitting sensitive credentials
 */
export type SafeUser = Omit<User, 'password'>

/**
 * Course assignment created by an admin and assigned to students
 */
export interface Assignment {
  id: string
  courseId: string
  submissionType: SubmissionType
  title: string
  description: string
  /** ISO 8601 date string for the assignment deadline */
  dueDate: string
  /** Link to shared Microsoft OneDrive / submission resources */
  oneDriveLink: string
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
 * Form input payload for creating or updating an assignment
 */
export interface AssignmentInput {
  courseId?: string
  submissionType?: SubmissionType
  title: string
  description: string
  /** ISO 8601 string or valid date string */
  dueDate: string
  /** Valid http or https URL */
  oneDriveLink: string
  /** Either 'all' (expanded to all active students) or a specific non-empty list of student IDs */
  assignedTo: 'all' | string[]
}

/**
 * Submission status options
 */
export type SubmissionStatus = 'submitted' | 'not_submitted'

/**
 * Student assignment submission record (used for individual assignments)
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
 * Student view of an assignment joined with their personal submission status
 */
export type StudentAssignment = Assignment & {
  status: SubmissionStatus
  submittedAt: string | null
}

/**
 * Submission joined with student profile information
 */
export type SubmissionWithStudent = Submission & {
  student: SafeUser
}

/**
 * Admin view of an assignment joined with all student submissions and aggregate counts
 */
export type AdminAssignment = Assignment & {
  submissions: SubmissionWithStudent[]
  submittedCount: number
  totalCount: number
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
  targetPath?: string
}
