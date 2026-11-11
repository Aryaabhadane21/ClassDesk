import {
  ApiError,
  assertRole,
  getStorageData,
  setAssignments,
  setGroupAcks,
  setSubmissions,
  simulateNetwork,
  toSafeUser,
} from '@/services/api/core'
import { buildGroupDetail } from '@/services/api/courses'
import { hasErrors, validateCourseAssignment } from '@/utils/validation'
import type {
  AdminAssignment,
  Assignment,
  AssignmentAudience,
  AssignmentInput,
  AssignmentTracking,
  CourseAssignmentInput,
  GroupDetail,
  ProfessorCourseAssignment,
  SafeUser,
  StudentAssignment,
  Submission,
  SubmissionStatus,
  SubmissionType,
  SubmissionWithStudent,
} from '@/types'

/**
 * Validates course assignment payload fields according to course & group rules.
 */
function validateCourseAssignmentPayload(
  input: CourseAssignmentInput,
  enrolledStudentIds: string[],
): void {
  const errors = validateCourseAssignment(input, { enrolledStudentIds })
  if (hasErrors(errors)) {
    const firstErrorMessage =
      errors.title ||
      errors.description ||
      errors.dueDate ||
      errors.oneDriveLink ||
      errors.submissionType ||
      errors.assignedTo ||
      'Invalid assignment input'
    throw new ApiError(firstErrorMessage, 'VALIDATION', errors as Record<string, string>)
  }
}

/**
 * Computes tracking matrix for a course assignment from the professor perspective
 */
function computeAssignmentTracking(
  assignment: Assignment,
  enrolledStudents: SafeUser[],
  courseGroups: GroupDetail[],
  submissions: Submission[],
  groupAcks: { assignmentId: string; groupId: string; acknowledgedAt: string; leaderId: string }[],
): AssignmentTracking {
  if (assignment.submissionType === 'individual') {
    const assignedIdsSet = new Set(assignment.assignedTo)
    const targetStudents = enrolledStudents.filter((s) => assignedIdsSet.has(s.id))

    const entries = targetStudents.map((student) => {
      const sub = submissions.find(
        (s) => s.assignmentId === assignment.id && s.studentId === student.id,
      )
      const status: SubmissionStatus = sub?.status === 'submitted' ? 'submitted' : 'not_submitted'
      return {
        student,
        status,
        submittedAt: status === 'submitted' ? (sub?.submittedAt ?? null) : null,
      }
    })

    // Sort: not_submitted first, then alphabetically by student name
    entries.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'not_submitted' ? -1 : 1
      }
      return a.student.name.localeCompare(b.student.name)
    })

    const submitted = entries.filter((e) => e.status === 'submitted').length

    return {
      kind: 'individual',
      total: targetStudents.length,
      submitted,
      entries,
    }
  }

  // Group assignment tracking
  const groupIdsWithStudent = new Set<string>()
  for (const group of courseGroups) {
    for (const member of group.members) {
      groupIdsWithStudent.add(member.id)
    }
  }

  const ungroupedStudents = enrolledStudents
    .filter((s) => !groupIdsWithStudent.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const entries = courseGroups.map((group) => {
    const ack = groupAcks.find(
      (ga) => ga.assignmentId === assignment.id && ga.groupId === group.id,
    )
    const isSubmitted = Boolean(ack)
    return {
      group,
      status: isSubmitted ? ('submitted' as const) : ('not_submitted' as const),
      acknowledgedAt: ack ? ack.acknowledgedAt : null,
    }
  })

  // Sort: not_submitted first, then alphabetically by group name
  entries.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'not_submitted' ? -1 : 1
    }
    return a.group.name.localeCompare(b.group.name)
  })

  const submitted = entries.filter((e) => e.status === 'submitted').length

  return {
    kind: 'group',
    total: courseGroups.length,
    submitted,
    entries,
    ungroupedStudents,
  }
}

// ---------------------------------------------------------------------------
// Course Assignment Methods (Round 2)
// ---------------------------------------------------------------------------

/**
 * Lists all assignments for a course ordered by due date ascending with tracking matrix.
 * Professor access required.
 */
export async function listCourseAssignments(
  professorId: string,
  courseId: string,
): Promise<ProfessorCourseAssignment[]> {
  await simulateNetwork()
  const { users, courses, enrollments, groups, groupAcks, assignments, submissions } =
    getStorageData()

  const user = users.find((u) => u.id === professorId)
  assertRole(user, 'admin', 'Professor')

  const course = courses.find((c) => c.id === courseId)
  if (!course) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  if (course.professorId !== professorId) {
    throw new ApiError('You do not have access to this course', 'UNAUTHORIZED')
  }

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  const enrolledStudentIds = enrollments
    .filter((e) => e.courseId === courseId)
    .map((e) => e.studentId)

  const enrolledStudents = enrolledStudentIds
    .map((id) => usersMap.get(id))
    .filter((u): u is SafeUser => Boolean(u))

  const courseGroups = groups
    .filter((g) => g.courseId === courseId)
    .map((g) => buildGroupDetail(g, usersMap))

  const courseAssignments = assignments
    .filter((a) => a.courseId === courseId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  return courseAssignments.map((assignment) => ({
    assignment,
    tracking: computeAssignmentTracking(
      assignment,
      enrolledStudents,
      courseGroups,
      submissions,
      groupAcks,
    ),
  }))
}

/**
 * Creates a new assignment for a course.
 * Automatically assigns to all currently enrolled students.
 * Initializes not_submitted records for individual assignments.
 */
export async function createCourseAssignment(
  professorId: string,
  courseId: string,
  input: CourseAssignmentInput,
): Promise<ProfessorCourseAssignment> {
  await simulateNetwork()
  const { users, courses, enrollments, groups, assignments, submissions } = getStorageData()

  const user = users.find((u) => u.id === professorId)
  assertRole(user, 'admin', 'Professor')

  const course = courses.find((c) => c.id === courseId)
  if (!course) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  if (course.professorId !== professorId) {
    throw new ApiError('You do not have access to this course', 'UNAUTHORIZED')
  }

  const enrolledStudentIds = enrollments
    .filter((e) => e.courseId === courseId)
    .map((e) => e.studentId)

  validateCourseAssignmentPayload(input, enrolledStudentIds)

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  const enrolledStudents = enrolledStudentIds
    .map((id) => usersMap.get(id))
    .filter((u): u is SafeUser => Boolean(u))

  let audience: AssignmentAudience = 'all'
  let targetAssignedTo: string[] = []

  if (input.submissionType === 'group') {
    audience = 'all'
    targetAssignedTo = [...enrolledStudentIds]
  } else {
    if (input.assignedTo === 'all') {
      audience = 'all'
      targetAssignedTo = [...enrolledStudentIds]
    } else {
      audience = 'selected'
      targetAssignedTo = Array.from(new Set(input.assignedTo))
    }
  }

  const now = new Date().toISOString()
  const assignmentId = `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const newAssignment: Assignment = {
    id: assignmentId,
    courseId,
    submissionType: input.submissionType,
    audience,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: new Date(input.dueDate).toISOString(),
    oneDriveLink: input.oneDriveLink.trim(),
    createdBy: professorId,
    assignedTo: targetAssignedTo,
    createdAt: now,
    updatedAt: now,
  }

  const updatedAssignments = [...assignments, newAssignment]
  let updatedSubmissions = submissions

  if (input.submissionType === 'individual') {
    const newSubmissions: Submission[] = targetAssignedTo.map((studentId) => ({
      id: `sub-${assignmentId}-${studentId}`,
      assignmentId,
      studentId,
      status: 'not_submitted',
      submittedAt: null,
    }))
    updatedSubmissions = [...submissions, ...newSubmissions]
    setSubmissions(updatedSubmissions)
  }

  setAssignments(updatedAssignments)

  const courseGroups = groups
    .filter((g) => g.courseId === courseId)
    .map((g) => buildGroupDetail(g, usersMap))

  return {
    assignment: newAssignment,
    tracking: computeAssignmentTracking(
      newAssignment,
      enrolledStudents,
      courseGroups,
      updatedSubmissions,
      [],
    ),
  }
}

/**
 * Updates an assignment's details.
 * Prevents changing submissionType if any submissions or group acknowledgements exist.
 */
export async function updateCourseAssignment(
  professorId: string,
  assignmentId: string,
  input: CourseAssignmentInput,
): Promise<ProfessorCourseAssignment> {
  await simulateNetwork()
  const { users, courses, enrollments, groups, groupAcks, assignments, submissions } =
    getStorageData()

  const user = users.find((u) => u.id === professorId)
  assertRole(user, 'admin', 'Professor')

  const assignmentIndex = assignments.findIndex((a) => a.id === assignmentId)
  if (assignmentIndex === -1) {
    throw new ApiError('Assignment not found', 'NOT_FOUND')
  }

  const existingAssignment = assignments[assignmentIndex]
  if (existingAssignment.createdBy !== professorId) {
    throw new ApiError('You do not have permission to modify this assignment', 'UNAUTHORIZED')
  }

  const enrolledStudentIds = enrollments
    .filter((e) => e.courseId === existingAssignment.courseId)
    .map((e) => e.studentId)

  validateCourseAssignmentPayload(input, enrolledStudentIds)

  let updatedSubmissions = [...submissions]

  let targetAudience: AssignmentAudience = 'all'
  let targetAssignedTo: string[] = []

  if (input.submissionType === 'group') {
    targetAudience = 'all'
    targetAssignedTo = [...enrolledStudentIds]
  } else {
    if (input.assignedTo === 'all') {
      targetAudience = 'all'
      targetAssignedTo = [...enrolledStudentIds]
    } else {
      targetAudience = 'selected'
      targetAssignedTo = Array.from(new Set(input.assignedTo))
    }
  }

  // Check if submissionType is changing
  if (input.submissionType !== existingAssignment.submissionType) {
    const hasIndividualSubs =
      existingAssignment.submissionType === 'individual' &&
      submissions.some((s) => s.assignmentId === assignmentId && s.status === 'submitted')

    const hasGroupAcks =
      existingAssignment.submissionType === 'group' &&
      groupAcks.some((ga) => ga.assignmentId === assignmentId)

    if (hasIndividualSubs || hasGroupAcks) {
      throw new ApiError(
        "The submission type can't be changed after submissions have started",
        'VALIDATION',
      )
    }

    if (input.submissionType === 'group') {
      // Switching from individual to group: purge individual submissions
      updatedSubmissions = updatedSubmissions.filter((s) => s.assignmentId !== assignmentId)
    } else {
      // Switching from group to individual: generate not_submitted submissions for targetAssignedTo
      for (const studentId of targetAssignedTo) {
        updatedSubmissions.push({
          id: `sub-${assignmentId}-${studentId}`,
          assignmentId,
          studentId,
          status: 'not_submitted',
          submittedAt: null,
        })
      }
    }
  } else if (input.submissionType === 'individual') {
    // Type remains individual: sync submissions with targetAssignedTo changes
    const previousAssigned = new Set(existingAssignment.assignedTo)
    const nextAssigned = new Set(targetAssignedTo)

    const addedStudents = targetAssignedTo.filter((id) => !previousAssigned.has(id))

    // Remove submissions for unselected/removed students (even submitted ones)
    updatedSubmissions = updatedSubmissions.filter((s) => {
      if (s.assignmentId === assignmentId && !nextAssigned.has(s.studentId)) {
        return false
      }
      return true
    })

    // Create submissions for newly added students
    for (const studentId of addedStudents) {
      updatedSubmissions.push({
        id: `sub-${assignmentId}-${studentId}`,
        assignmentId,
        studentId,
        status: 'not_submitted',
        submittedAt: null,
      })
    }
  }

  const course = courses.find((c) => c.id === existingAssignment.courseId)
  if (!course) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  const enrolledStudents = enrolledStudentIds
    .map((id) => usersMap.get(id))
    .filter((u): u is SafeUser => Boolean(u))

  const now = new Date().toISOString()
  const updatedAssignment: Assignment = {
    ...existingAssignment,
    submissionType: input.submissionType,
    audience: targetAudience,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: new Date(input.dueDate).toISOString(),
    oneDriveLink: input.oneDriveLink.trim(),
    assignedTo: targetAssignedTo,
    updatedAt: now,
  }

  const updatedAssignments = [...assignments]
  updatedAssignments[assignmentIndex] = updatedAssignment

  setAssignments(updatedAssignments)
  setSubmissions(updatedSubmissions)

  const courseGroups = groups
    .filter((g) => g.courseId === existingAssignment.courseId)
    .map((g) => buildGroupDetail(g, usersMap))

  return {
    assignment: updatedAssignment,
    tracking: computeAssignmentTracking(
      updatedAssignment,
      enrolledStudents,
      courseGroups,
      updatedSubmissions,
      groupAcks,
    ),
  }
}

/**
 * Deletes a course assignment and purges all of its submissions and group acknowledgements.
 */
export async function deleteCourseAssignment(
  professorId: string,
  assignmentId: string,
): Promise<void> {
  await simulateNetwork()
  const { users, assignments, submissions, groupAcks } = getStorageData()

  const user = users.find((u) => u.id === professorId)
  assertRole(user, 'admin', 'Professor')

  const assignment = assignments.find((a) => a.id === assignmentId)
  if (!assignment) {
    throw new ApiError('Assignment not found', 'NOT_FOUND')
  }

  if (assignment.createdBy !== professorId) {
    throw new ApiError('You do not have permission to delete this assignment', 'UNAUTHORIZED')
  }

  const remainingAssignments = assignments.filter((a) => a.id !== assignmentId)
  const remainingSubmissions = submissions.filter((s) => s.assignmentId !== assignmentId)
  const remainingAcks = groupAcks.filter((ga) => ga.assignmentId !== assignmentId)

  setAssignments(remainingAssignments)
  setSubmissions(remainingSubmissions)
  setGroupAcks(remainingAcks)
}

// ---------------------------------------------------------------------------
// Legacy Assignment Methods (retained for current screens; legacy, replaced by the course functions in steps 6-13)
// ---------------------------------------------------------------------------

/**
 * Validate legacy assignment input fields
 */
function validateLegacyAssignmentInput(input: AssignmentInput, allStudentIds: string[]): string[] {
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
    const parsed = new URL(input.oneDriveLink)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error()
    }
  } catch {
    throw new ApiError('OneDrive link must be a valid http or https URL', 'VALIDATION')
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

/**
 * Retrieves all assignments assigned to a specific student with their submission status.
 * legacy, replaced by the course functions in steps 6-13
 */
export async function getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  assertRole(student, 'student', 'Student')

  const studentAssignments = assignments.filter(
    (a) => a.assignedTo.includes(studentId) && a.submissionType === 'individual',
  )

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
 * Retrieves all assignments created by a specific admin with detailed submission lists and counts.
 * legacy, replaced by the course functions in steps 6-13
 */
export async function getAdminAssignments(adminId: string): Promise<AdminAssignment[]> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  const adminAssignments = assignments.filter(
    (a) => a.createdBy === adminId && a.submissionType === 'individual',
  )
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
 * Creates a new assignment by an admin and initializes not_submitted records for all assigned students.
 * legacy, replaced by the course functions in steps 6-13
 */
export async function createAssignment(
  adminId: string,
  input: AssignmentInput,
): Promise<AdminAssignment> {
  await simulateNetwork()
  const { users, courses, assignments, submissions } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  const allStudentIds = users.filter((u) => u.role === 'student').map((u) => u.id)
  const targetStudentIds = validateLegacyAssignmentInput(input, allStudentIds)

  const professorCourses = courses.filter((c) => c.professorId === adminId)

  let courseId = input.courseId
  if (!courseId) {
    courseId = professorCourses[0]?.id || 'course-web101'
  } else {
    const course = professorCourses.find((c) => c.id === courseId)
    if (!course) {
      throw new ApiError('Course does not belong to this professor', 'VALIDATION')
    }
  }

  const submissionType: SubmissionType = input.submissionType || 'individual'
  if (submissionType !== 'individual' && submissionType !== 'group') {
    throw new ApiError('Invalid submission type', 'VALIDATION')
  }

  const now = new Date().toISOString()
  const assignmentId = `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const audience: AssignmentAudience = Array.isArray(input.assignedTo) ? 'selected' : 'all'

  const newAssignment: Assignment = {
    id: assignmentId,
    courseId,
    submissionType,
    audience,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: new Date(input.dueDate).toISOString(),
    oneDriveLink: input.oneDriveLink.trim(),
    createdBy: adminId,
    assignedTo: targetStudentIds,
    createdAt: now,
    updatedAt: now,
  }

  const newSubmissions: Submission[] = targetStudentIds.map((studentId) => ({
    id: `sub-${assignmentId}-${studentId}`,
    assignmentId,
    studentId,
    status: 'not_submitted',
    submittedAt: null,
  }))

  assignments.push(newAssignment)
  const updatedSubmissions = [...submissions, ...newSubmissions]

  setAssignments(assignments)
  setSubmissions(updatedSubmissions)

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
 * Updates an assignment's details and synchronizes student submissions when assignedTo changes.
 * legacy, replaced by the course functions in steps 6-13
 */
export async function updateAssignment(
  adminId: string,
  assignmentId: string,
  input: AssignmentInput,
): Promise<AdminAssignment> {
  await simulateNetwork()
  const { users, courses, assignments, submissions } = getStorageData()

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
  const targetStudentIds = validateLegacyAssignmentInput(input, allStudentIds)

  const previousAssigned = new Set(existingAssignment.assignedTo)
  const nextAssigned = new Set(targetStudentIds)

  const addedStudents = targetStudentIds.filter((id) => !previousAssigned.has(id))
  const removedStudents = existingAssignment.assignedTo.filter((id) => !nextAssigned.has(id))

  const filteredSubmissions = submissions.filter((sub) => {
    if (sub.assignmentId === assignmentId && removedStudents.includes(sub.studentId)) {
      return false
    }
    return true
  })

  for (const studentId of addedStudents) {
    filteredSubmissions.push({
      id: `sub-${assignmentId}-${studentId}`,
      assignmentId,
      studentId,
      status: 'not_submitted',
      submittedAt: null,
    })
  }

  const professorCourses = courses.filter((c) => c.professorId === adminId)

  let courseId = existingAssignment.courseId
  if (input.courseId) {
    const course = professorCourses.find((c) => c.id === input.courseId)
    if (!course) {
      throw new ApiError('Course does not belong to this professor', 'VALIDATION')
    }
    courseId = input.courseId
  }

  let submissionType: SubmissionType = existingAssignment.submissionType || 'individual'
  if (input.submissionType) {
    if (input.submissionType !== 'individual' && input.submissionType !== 'group') {
      throw new ApiError('Invalid submission type', 'VALIDATION')
    }
    submissionType = input.submissionType
  }

  const audience: AssignmentAudience =
    input.assignedTo === 'all'
      ? 'all'
      : Array.isArray(input.assignedTo)
        ? 'selected'
        : existingAssignment.audience || 'all'

  const now = new Date().toISOString()
  const updatedAssignment: Assignment = {
    ...existingAssignment,
    courseId,
    submissionType,
    audience,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: new Date(input.dueDate).toISOString(),
    oneDriveLink: input.oneDriveLink.trim(),
    assignedTo: targetStudentIds,
    updatedAt: now,
  }

  assignments[assignmentIndex] = updatedAssignment

  setAssignments(assignments)
  setSubmissions(filteredSubmissions)

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
 * Deletes an assignment and purges all of its associated submissions.
 * legacy, replaced by the course functions in steps 6-13
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

  setAssignments(remainingAssignments)
  setSubmissions(remainingSubmissions)
}
