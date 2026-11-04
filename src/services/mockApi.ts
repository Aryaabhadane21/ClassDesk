import { readJSON, writeJSON, ensureSeeded } from '@/services/storage'
import { STORAGE_KEYS } from '@/utils/constants'
import type {
  AdminAssignment,
  Assignment,
  AssignmentInput,
  Role,
  SafeUser,
  StudentAssignment,
  Submission,
  SubmissionWithStudent,
  User,
} from '@/types'

/**
 * Supported API error codes
 */
export type ApiErrorCode = 'NETWORK' | 'VALIDATION' | 'UNAUTHORIZED' | 'NOT_FOUND'

/**
 * Custom API Error for client-side service handling
 */
export class ApiError extends Error {
  code: ApiErrorCode

  constructor(message: string, code: ApiErrorCode) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Configurable simulation parameters
 */
export interface MockApiConfig {
  minLatencyMs: number
  maxLatencyMs: number
  failureRate: number
}

export const apiConfig: MockApiConfig = {
  minLatencyMs: 300,
  maxLatencyMs: 700,
  failureRate: 0,
}

/**
 * Configure API latency and failure rate (used by test harnesses and dev tools).
 */
export function setApiConfig(
  config: Partial<{
    latency: [number, number]
    minLatencyMs: number
    maxLatencyMs: number
    failureRate: number
  }>,
): void {
  if (config.latency) {
    apiConfig.minLatencyMs = config.latency[0]
    apiConfig.maxLatencyMs = config.latency[1]
  }
  if (typeof config.minLatencyMs === 'number') apiConfig.minLatencyMs = config.minLatencyMs
  if (typeof config.maxLatencyMs === 'number') apiConfig.maxLatencyMs = config.maxLatencyMs
  if (typeof config.failureRate === 'number') apiConfig.failureRate = config.failureRate
}

/**
 * Simulate network latency and optional failure
 */
async function simulateNetwork(): Promise<void> {
  const min = apiConfig.minLatencyMs
  const max = apiConfig.maxLatencyMs
  const latency = min <= max ? Math.floor(Math.random() * (max - min + 1)) + min : 0

  if (latency > 0) {
    await new Promise((resolve) => setTimeout(resolve, latency))
  }

  let rate = apiConfig.failureRate
  if (typeof window !== 'undefined' && window.location?.search?.includes('simulateErrors=true')) {
    rate = 0.25
  }

  if (rate > 0 && Math.random() < rate) {
    throw new ApiError('Network connection failed. Please try again.', 'NETWORK')
  }
}

/**
 * Strips password to produce a SafeUser
 */
function toSafeUser(user: User): SafeUser {
  const { password: _, ...safe } = user
  return safe
}

/**
 * Helper to ensure storage is seeded before read/write operations
 */
function getStorageData() {
  ensureSeeded()
  const users = readJSON<User[]>(STORAGE_KEYS.USERS, [])
  const assignments = readJSON<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, [])
  const submissions = readJSON<Submission[]>(STORAGE_KEYS.SUBMISSIONS, [])
  return { users, assignments, submissions }
}

/**
 * Validate user role or throw unauthorized error
 */
function assertRole(user: User | undefined, expectedRole: Role, roleName: string): User {
  if (!user || user.role !== expectedRole) {
    throw new ApiError(`${roleName} permission required`, 'UNAUTHORIZED')
  }
  return user
}

/**
 * Validate assignment input fields
 */
function validateAssignmentInput(input: AssignmentInput, allStudentIds: string[]): string[] {
  const trimmedTitle = input.title ? input.title.trim() : ''
  if (trimmedTitle.length < 3 || trimmedTitle.length > 80) {
    throw new ApiError('Title must be between 3 and 80 characters', 'VALIDATION')
  }

  const trimmedDesc = input.description ? input.description.trim() : ''
  if (!trimmedDesc) {
    throw new ApiError('Description is required', 'VALIDATION')
  }
  if (trimmedDesc.length > 500) {
    throw new ApiError('Description must not exceed 500 characters', 'VALIDATION')
  }

  const dueTimestamp = new Date(input.dueDate).getTime()
  if (isNaN(dueTimestamp)) {
    throw new ApiError('Due date must be a valid date', 'VALIDATION')
  }

  try {
    const parsed = new URL(input.driveLink)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error()
    }
  } catch {
    throw new ApiError('Drive link must be a valid http or https URL', 'VALIDATION')
  }

  let assignedIds: string[] = []
  if (input.assignedTo === 'all') {
    assignedIds = [...allStudentIds]
  } else if (Array.isArray(input.assignedTo) && input.assignedTo.length > 0) {
    for (const id of input.assignedTo) {
      if (!allStudentIds.includes(id)) {
        throw new ApiError(`Invalid student ID in assignment selection: ${id}`, 'VALIDATION')
      }
    }
    assignedIds = Array.from(new Set(input.assignedTo))
  } else {
    throw new ApiError('Assignment must be assigned to "all" or at least one student', 'VALIDATION')
  }

  return assignedIds
}

// ---------------------------------------------------------------------------
// Mock API Methods
// ---------------------------------------------------------------------------

/**
 * Authenticates user credentials.
 * Email comparison is case-insensitive and trimmed.
 */
export async function login(email: string, password: string): Promise<SafeUser> {
  await simulateNetwork()
  const { users } = getStorageData()

  const normalizedEmail = email ? email.trim().toLowerCase() : ''
  const user = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail)

  if (!user || user.password !== password) {
    throw new ApiError('Incorrect email or password', 'UNAUTHORIZED')
  }

  return toSafeUser(user)
}

/**
 * Fetches a user profile by ID without exposing password
 */
export async function getUserById(id: string): Promise<SafeUser> {
  await simulateNetwork()
  const { users } = getStorageData()

  const user = users.find((u) => u.id === id)
  if (!user) {
    throw new ApiError('User not found', 'NOT_FOUND')
  }

  return toSafeUser(user)
}

/**
 * Lists all student profiles (admin access required)
 */
export async function listStudents(adminId: string): Promise<SafeUser[]> {
  await simulateNetwork()
  const { users } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  return users.filter((u) => u.role === 'student').map(toSafeUser)
}

/**
 * Retrieves all assignments assigned to a specific student with their submission status
 */
export async function getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  assertRole(student, 'student', 'Student')

  // Filter assignments assigned to this student
  const studentAssignments = assignments.filter((a) => a.assignedTo.includes(studentId))

  return studentAssignments.map((assignment) => {
    const submission = submissions.find(
      (s) => s.assignmentId === assignment.id && s.studentId === studentId,
    )

    return {
      ...assignment,
      status: submission ? submission.status : 'not_submitted',
      submittedAt: submission ? submission.submittedAt : null,
    }
  })
}

/**
 * Marks an assignment as submitted for a student.
 * Idempotent: sets status to 'submitted' and submittedAt to current time.
 */
export async function markSubmitted(
  studentId: string,
  assignmentId: string,
): Promise<StudentAssignment> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  assertRole(student, 'student', 'Student')

  const assignment = assignments.find((a) => a.id === assignmentId)
  if (!assignment || !assignment.assignedTo.includes(studentId)) {
    throw new ApiError('Assignment not found for this student', 'NOT_FOUND')
  }

  const now = new Date().toISOString()
  const existingSubIndex = submissions.findIndex(
    (s) => s.assignmentId === assignmentId && s.studentId === studentId,
  )

  let updatedSubmission: Submission
  if (existingSubIndex >= 0) {
    updatedSubmission = {
      ...submissions[existingSubIndex],
      status: 'submitted',
      submittedAt: submissions[existingSubIndex].submittedAt || now,
    }
    submissions[existingSubIndex] = updatedSubmission
  } else {
    updatedSubmission = {
      id: `sub-${assignmentId}-${studentId}`,
      assignmentId,
      studentId,
      status: 'submitted',
      submittedAt: now,
    }
    submissions.push(updatedSubmission)
  }

  writeJSON(STORAGE_KEYS.SUBMISSIONS, submissions)

  return {
    ...assignment,
    status: updatedSubmission.status,
    submittedAt: updatedSubmission.submittedAt,
  }
}

/**
 * Retrieves all assignments created by a specific admin with detailed submission lists and counts
 */
export async function getAdminAssignments(adminId: string): Promise<AdminAssignment[]> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  // Filter only assignments created by this admin
  const adminAssignments = assignments.filter((a) => a.createdBy === adminId)
  const studentsMap = new Map<string, SafeUser>()
  for (const u of users) {
    if (u.role === 'student') {
      studentsMap.set(u.id, toSafeUser(u))
    }
  }

  return adminAssignments.map((assignment) => {
    const joinedSubmissions: SubmissionWithStudent[] = []
    let submittedCount = 0

    for (const studentId of assignment.assignedTo) {
      const student = studentsMap.get(studentId)
      if (!student) continue

      const sub = submissions.find(
        (s) => s.assignmentId === assignment.id && s.studentId === studentId,
      )

      const status = sub ? sub.status : 'not_submitted'
      const submittedAt = sub ? sub.submittedAt : null

      if (status === 'submitted') {
        submittedCount += 1
      }

      joinedSubmissions.push({
        id: sub ? sub.id : `sub-${assignment.id}-${studentId}`,
        assignmentId: assignment.id,
        studentId,
        status,
        submittedAt,
        student,
      })
    }

    return {
      ...assignment,
      submissions: joinedSubmissions,
      submittedCount,
      totalCount: assignment.assignedTo.length,
    }
  })
}

/**
 * Creates a new assignment by an admin and initializes not_submitted records for all assigned students
 */
export async function createAssignment(
  adminId: string,
  input: AssignmentInput,
): Promise<AdminAssignment> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  const allStudentIds = users.filter((u) => u.role === 'student').map((u) => u.id)
  const targetStudentIds = validateAssignmentInput(input, allStudentIds)

  const now = new Date().toISOString()
  const assignmentId = `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const newAssignment: Assignment = {
    id: assignmentId,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: new Date(input.dueDate).toISOString(),
    driveLink: input.driveLink.trim(),
    createdBy: adminId,
    assignedTo: targetStudentIds,
    createdAt: now,
    updatedAt: now,
  }

  // Create not_submitted submissions for each assigned student
  const newSubmissions: Submission[] = targetStudentIds.map((studentId) => ({
    id: `sub-${assignmentId}-${studentId}`,
    assignmentId,
    studentId,
    status: 'not_submitted',
    submittedAt: null,
  }))

  assignments.push(newAssignment)
  const updatedSubmissions = [...submissions, ...newSubmissions]

  writeJSON(STORAGE_KEYS.ASSIGNMENTS, assignments)
  writeJSON(STORAGE_KEYS.SUBMISSIONS, updatedSubmissions)

  const studentsMap = new Map<string, SafeUser>()
  for (const u of users) {
    if (u.role === 'student') {
      studentsMap.set(u.id, toSafeUser(u))
    }
  }

  const submissionsWithStudent: SubmissionWithStudent[] = targetStudentIds.map((studentId) => ({
    id: `sub-${assignmentId}-${studentId}`,
    assignmentId,
    studentId,
    status: 'not_submitted',
    submittedAt: null,
    student: studentsMap.get(studentId)!,
  }))

  return {
    ...newAssignment,
    submissions: submissionsWithStudent,
    submittedCount: 0,
    totalCount: targetStudentIds.length,
  }
}

/**
 * Updates an assignment's details and synchronizes student submissions when assignedTo changes
 */
export async function updateAssignment(
  adminId: string,
  assignmentId: string,
  input: AssignmentInput,
): Promise<AdminAssignment> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  const assignmentIndex = assignments.findIndex((a) => a.id === assignmentId)
  if (assignmentIndex === -1) {
    throw new ApiError('Assignment not found', 'NOT_FOUND')
  }

  const existingAssignment = assignments[assignmentIndex]
  if (existingAssignment.createdBy !== adminId) {
    throw new ApiError('You do not have permission to modify this assignment', 'UNAUTHORIZED')
  }

  const allStudentIds = users.filter((u) => u.role === 'student').map((u) => u.id)
  const targetStudentIds = validateAssignmentInput(input, allStudentIds)

  const previousAssigned = new Set(existingAssignment.assignedTo)
  const nextAssigned = new Set(targetStudentIds)

  const addedStudents = targetStudentIds.filter((id) => !previousAssigned.has(id))
  const removedStudents = existingAssignment.assignedTo.filter((id) => !nextAssigned.has(id))

  // Keep submissions for students who remain or for other assignments; remove for unassigned students
  const filteredSubmissions = submissions.filter((sub) => {
    if (sub.assignmentId === assignmentId && removedStudents.includes(sub.studentId)) {
      return false
    }
    return true
  })

  // Create fresh not_submitted submissions for newly added students
  for (const studentId of addedStudents) {
    filteredSubmissions.push({
      id: `sub-${assignmentId}-${studentId}`,
      assignmentId,
      studentId,
      status: 'not_submitted',
      submittedAt: null,
    })
  }

  const now = new Date().toISOString()
  const updatedAssignment: Assignment = {
    ...existingAssignment,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: new Date(input.dueDate).toISOString(),
    driveLink: input.driveLink.trim(),
    assignedTo: targetStudentIds,
    updatedAt: now,
  }

  assignments[assignmentIndex] = updatedAssignment

  writeJSON(STORAGE_KEYS.ASSIGNMENTS, assignments)
  writeJSON(STORAGE_KEYS.SUBMISSIONS, filteredSubmissions)

  const studentsMap = new Map<string, SafeUser>()
  for (const u of users) {
    if (u.role === 'student') {
      studentsMap.set(u.id, toSafeUser(u))
    }
  }

  let submittedCount = 0
  const submissionsWithStudent: SubmissionWithStudent[] = targetStudentIds.map((studentId) => {
    const sub = filteredSubmissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === studentId,
    )
    const status = sub ? sub.status : 'not_submitted'
    const submittedAt = sub ? sub.submittedAt : null

    if (status === 'submitted') {
      submittedCount += 1
    }

    return {
      id: sub ? sub.id : `sub-${assignmentId}-${studentId}`,
      assignmentId,
      studentId,
      status,
      submittedAt,
      student: studentsMap.get(studentId)!,
    }
  })

  return {
    ...updatedAssignment,
    submissions: submissionsWithStudent,
    submittedCount,
    totalCount: targetStudentIds.length,
  }
}

/**
 * Deletes an assignment and purges all of its associated submissions (admin ownership required)
 */
export async function deleteAssignment(adminId: string, assignmentId: string): Promise<void> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  const assignment = assignments.find((a) => a.id === assignmentId)
  if (!assignment) {
    throw new ApiError('Assignment not found', 'NOT_FOUND')
  }

  if (assignment.createdBy !== adminId) {
    throw new ApiError('You do not have permission to delete this assignment', 'UNAUTHORIZED')
  }

  const remainingAssignments = assignments.filter((a) => a.id !== assignmentId)
  const remainingSubmissions = submissions.filter((s) => s.assignmentId !== assignmentId)

  writeJSON(STORAGE_KEYS.ASSIGNMENTS, remainingAssignments)
  writeJSON(STORAGE_KEYS.SUBMISSIONS, remainingSubmissions)
}

export const mockApi = {
  login,
  getUserById,
  listStudents,
  getStudentAssignments,
  markSubmitted,
  getAdminAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
}
