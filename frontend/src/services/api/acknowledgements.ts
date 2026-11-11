import {
  ApiError,
  assertRole,
  getStorageData,
  setGroupAcks,
  setSubmissions,
  simulateNetwork,
  toSafeUser,
} from '@/services/api/core'
import { buildGroupDetail } from '@/services/api/courses'
import type {
  AckInfo,
  SafeUser,
  StudentAssignment,
  StudentCourseAssignment,
  Submission,
} from '@/types'

/**
 * Retrieves all course assignments for an enrolled student with acknowledgement state.
 * Returns assignments ordered by due date ascending.
 */
export async function getStudentCourseAssignments(
  studentId: string,
  courseId: string,
): Promise<StudentCourseAssignment[]> {
  await simulateNetwork()
  const { users, courses, enrollments, groups, groupAcks, assignments, submissions } =
    getStorageData()

  const student = assertRole(
    users.find((u) => u.id === studentId),
    'student',
    'Student',
  )

  const course = courses.find((c) => c.id === courseId)
  if (!course) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  const isEnrolled = enrollments.some(
    (e) => e.courseId === courseId && e.studentId === studentId,
  )
  if (!isEnrolled) {
    throw new ApiError('You are not enrolled in this course', 'UNAUTHORIZED')
  }

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  const myGroup = groups.find(
    (g) => g.courseId === courseId && g.memberIds.includes(studentId),
  )
  const groupDetail = myGroup ? buildGroupDetail(myGroup, usersMap) : null

  const courseAssignments = assignments
    .filter((a) => a.courseId === courseId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  return courseAssignments.map((assignment) => {
    if (assignment.submissionType === 'individual') {
      const sub = submissions.find(
        (s) => s.assignmentId === assignment.id && s.studentId === studentId,
      )
      const acknowledged = sub?.status === 'submitted'
      return {
        assignment,
        ack: {
          acknowledged,
          acknowledgedAt: acknowledged ? (sub?.submittedAt ?? null) : null,
          acknowledgedBy: acknowledged ? toSafeUser(student) : null,
        },
      }
    }

    // Group assignment
    if (!myGroup) {
      return {
        assignment,
        ack: {
          acknowledged: false,
          acknowledgedAt: null,
          acknowledgedBy: null,
        },
        group: {
          state: 'no_group',
          detail: null,
          canAcknowledge: false,
        },
      }
    }

    const ackRecord = groupAcks.find(
      (ga) => ga.assignmentId === assignment.id && ga.groupId === myGroup.id,
    )
    const acknowledged = Boolean(ackRecord)
    const isLeader = myGroup.leaderId === studentId

    return {
      assignment,
      ack: {
        acknowledged,
        acknowledgedAt: ackRecord ? ackRecord.acknowledgedAt : null,
        acknowledgedBy: ackRecord ? usersMap.get(ackRecord.leaderId) || null : null,
      },
      group: {
        state: isLeader ? 'leader' : 'member',
        detail: groupDetail,
        canAcknowledge: isLeader && !acknowledged,
      },
    }
  })
}

/**
 * Marks an individual assignment as submitted for a student.
 * Throws a VALIDATION error if invoked for a group assignment.
 * Idempotent: sets status to 'submitted' and submittedAt to current time.
 */
export async function markSubmitted(
  studentId: string,
  assignmentId: string,
): Promise<StudentAssignment> {
  await simulateNetwork()
  const { users, assignments, submissions } = getStorageData()

  assertRole(
    users.find((u) => u.id === studentId),
    'student',
    'Student',
  )

  const assignment = assignments.find((a) => a.id === assignmentId)
  if (!assignment || !assignment.assignedTo.includes(studentId)) {
    throw new ApiError('Assignment not found for this student', 'NOT_FOUND')
  }

  if (assignment.submissionType === 'group') {
    throw new ApiError(
      'This is a group assignment. Only the group leader can acknowledge it.',
      'VALIDATION',
    )
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

  setSubmissions(submissions)

  return {
    ...assignment,
    status: updatedSubmission.status,
    submittedAt: updatedSubmission.submittedAt,
  }
}

/**
 * Acknowledges a group assignment on behalf of a student group.
 * Only the group leader can acknowledge.
 * Idempotent: if already acknowledged, returns the existing acknowledgement info.
 */
export async function acknowledgeGroupAssignment(
  studentId: string,
  assignmentId: string,
): Promise<AckInfo> {
  await simulateNetwork()
  const { users, assignments, enrollments, groups, groupAcks } = getStorageData()

  const student = assertRole(
    users.find((u) => u.id === studentId),
    'student',
    'Student',
  )

  const assignment = assignments.find((a) => a.id === assignmentId)
  if (!assignment) {
    throw new ApiError('Assignment not found', 'NOT_FOUND')
  }

  if (assignment.submissionType !== 'group') {
    throw new ApiError('This is an individual assignment. Submit it individually.', 'VALIDATION')
  }

  const isEnrolled = enrollments.some(
    (e) => e.courseId === assignment.courseId && e.studentId === studentId,
  )
  if (!isEnrolled) {
    throw new ApiError('You are not enrolled in this course', 'VALIDATION')
  }

  const group = groups.find(
    (g) => g.courseId === assignment.courseId && g.memberIds.includes(studentId),
  )
  if (!group) {
    throw new ApiError('You are not part of any group in this course', 'VALIDATION')
  }

  if (group.leaderId !== studentId) {
    throw new ApiError('Only the group leader can acknowledge this assignment', 'UNAUTHORIZED')
  }

  const existingAck = groupAcks.find(
    (ga) => ga.assignmentId === assignmentId && ga.groupId === group.id,
  )

  if (existingAck) {
    return {
      acknowledged: true,
      acknowledgedAt: existingAck.acknowledgedAt,
      acknowledgedBy: toSafeUser(student),
    }
  }

  const now = new Date().toISOString()
  const newAck = {
    id: `ack-${assignmentId}-${group.id}`,
    assignmentId,
    groupId: group.id,
    leaderId: studentId,
    acknowledgedAt: now,
  }

  setGroupAcks([...groupAcks, newAck])

  return {
    acknowledged: true,
    acknowledgedAt: now,
    acknowledgedBy: toSafeUser(student),
  }
}

/**
 * Retrieves aggregate progress (total and acknowledged assignment counts) for a student in a course.
 */
export async function getStudentCourseProgress(
  studentId: string,
  courseId: string,
): Promise<{ total: number; acknowledged: number }> {
  await simulateNetwork()
  const { users, courses, enrollments, groups, groupAcks, assignments, submissions } =
    getStorageData()

  assertRole(
    users.find((u) => u.id === studentId),
    'student',
    'Student',
  )

  const course = courses.find((c) => c.id === courseId)
  if (!course) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  const isEnrolled = enrollments.some(
    (e) => e.courseId === courseId && e.studentId === studentId,
  )
  if (!isEnrolled) {
    throw new ApiError('You are not enrolled in this course', 'UNAUTHORIZED')
  }

  const myGroup = groups.find(
    (g) => g.courseId === courseId && g.memberIds.includes(studentId),
  )

  const courseAssignments = assignments.filter((a) => a.courseId === courseId)
  const total = courseAssignments.length
  let acknowledged = 0

  for (const assignment of courseAssignments) {
    if (assignment.submissionType === 'individual') {
      const sub = submissions.find(
        (s) => s.assignmentId === assignment.id && s.studentId === studentId,
      )
      if (sub?.status === 'submitted') {
        acknowledged += 1
      }
    } else if (assignment.submissionType === 'group' && myGroup) {
      const ack = groupAcks.find(
        (ga) => ga.assignmentId === assignment.id && ga.groupId === myGroup.id,
      )
      if (ack) {
        acknowledged += 1
      }
    }
  }

  return { total, acknowledged }
}
