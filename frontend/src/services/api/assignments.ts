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
  AssignmentTracking,
  CourseAssignmentInput,
  GroupDetail,
  ProfessorCourseAssignment,
  SafeUser,
  StudentAssignment,
  Submission,
  SubmissionStatus,
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
 * Retrieves a single course assignment with full tracking details for the professor.
 */
export async function getCourseAssignment(
  professorId: string,
  courseId: string,
  assignmentId: string,
): Promise<ProfessorCourseAssignment> {
  const list = await listCourseAssignments(professorId, courseId)
  const item = list.find((a) => a.assignment.id === assignmentId)
  if (!item) {
    throw new ApiError('Assignment not found', 'NOT_FOUND')
  }
  return item
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
// Cross-Course Assignment Aggregate Queries (Calendar & Notifications)
// ---------------------------------------------------------------------------

/**
 * Retrieves all assignments for an enrolled student across their courses
 * with their submission/acknowledgement status.
 */
export async function getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
  await simulateNetwork()
  const { users, enrollments, groups, groupAcks, assignments, submissions } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  assertRole(student, 'student', 'Student')

  const enrolledCourseIds = new Set(
    enrollments.filter((e) => e.studentId === studentId).map((e) => e.courseId),
  )

  const userGroups = groups.filter((g) => g.memberIds.includes(studentId))
  const userGroupMap = new Map<string, string>() // courseId -> groupId
  for (const g of userGroups) {
    userGroupMap.set(g.courseId, g.id)
  }

  const studentAssignments = assignments.filter((a) => {
    if (!enrolledCourseIds.has(a.courseId)) return false
    if (a.submissionType === 'group') return true
    return a.assignedTo.includes(studentId)
  })

  return studentAssignments.map((assignment) => {
    let status: SubmissionStatus = 'not_submitted'
    let submittedAt: string | null = null

    if (assignment.submissionType === 'individual') {
      const submission = submissions.find(
        (s) => s.assignmentId === assignment.id && s.studentId === studentId,
      )
      if (submission) {
        status = submission.status
        submittedAt = submission.submittedAt
      }
    } else {
      const groupId = userGroupMap.get(assignment.courseId)
      if (groupId) {
        const ack = groupAcks.find(
          (ga) => ga.assignmentId === assignment.id && ga.groupId === groupId,
        )
        if (ack) {
          status = 'submitted'
          submittedAt = ack.acknowledgedAt
        }
      }
    }

    return {
      ...assignment,
      status,
      submittedAt,
    }
  })
}

/**
 * Retrieves all assignments across all courses taught by an admin/professor
 * with submission lists and counts.
 */
export async function getAdminAssignments(adminId: string): Promise<AdminAssignment[]> {
  await simulateNetwork()
  const { users, courses, assignments, submissions, groups, groupAcks } = getStorageData()

  const admin = users.find((u) => u.id === adminId)
  assertRole(admin, 'admin', 'Admin')

  const profCourses = courses.filter((c) => c.professorId === adminId)
  const profCourseIds = new Set(profCourses.map((c) => c.id))

  const adminAssignments = assignments.filter((a) => profCourseIds.has(a.courseId))

  const studentsMap = new Map<string, SafeUser>()
  for (const u of users) {
    if (u.role === 'student') {
      studentsMap.set(u.id, toSafeUser(u))
    }
  }

  return adminAssignments.map((assignment) => {
    const isGroup = assignment.submissionType === 'group'
    const courseGroups = groups.filter((g) => g.courseId === assignment.courseId)

    if (isGroup) {
      const acks = groupAcks.filter((ga) => ga.assignmentId === assignment.id)
      return {
        ...assignment,
        submissions: [],
        submittedCount: acks.length,
        totalCount: courseGroups.length,
      }
    }

    let submittedCount = 0
    const joinedSubmissions: SubmissionWithStudent[] = []

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
