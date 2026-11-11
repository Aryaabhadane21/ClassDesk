import {
  ApiError,
  assertRole,
  getStorageData,
  setAssignments,
  setCourses,
  setEnrollments,
  setSubmissions,
  simulateNetwork,
  toSafeUser,
} from '@/services/api/core'
import { validateCourse } from '@/utils/validation'
import type {
  Course,
  CourseInput,
  Enrollment,
  Group,
  GroupDetail,
  ProfessorCourse,
  SafeUser,
  StudentCourse,
  Submission,
} from '@/types'

/**
 * Builds a GroupDetail populated with leader and member SafeUser profiles.
 * The leader is always listed first in the members array.
 */
export function buildGroupDetail(
  group: Group,
  usersMap: Map<string, SafeUser>,
): GroupDetail {
  const leader = usersMap.get(group.leaderId) || {
    id: group.leaderId,
    name: 'Unknown Student',
    email: '',
    role: 'student',
  }

  const otherMemberIds = group.memberIds.filter((id) => id !== group.leaderId)
  const otherMembers = otherMemberIds
    .map((id) => usersMap.get(id))
    .filter((u): u is SafeUser => Boolean(u))

  return {
    ...group,
    leader,
    members: [leader, ...otherMembers],
  }
}

/**
 * Generates an uppercase, human-readable joinCode avoiding ambiguous characters (0, O, 1, I).
 * Format: ABC-4K7P
 */
function generateJoinCode(existingCodes: Set<string>): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  do {
    const part1 = Array.from(
      { length: 3 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('')
    const part2 = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('')
    code = `${part1}-${part2}`
  } while (existingCodes.has(code))

  return code
}

/**
 * Normalizes course join code for case, space, and dash tolerance
 */
function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '')
}

/**
 * Lists courses taught by a professor with aggregate metrics (newest first).
 */
export async function listProfessorCourses(
  professorId: string,
): Promise<ProfessorCourse[]> {
  await simulateNetwork()
  const { users, courses, enrollments, assignments, groups } = getStorageData()

  const professor = users.find((u) => u.id === professorId)
  assertRole(professor, 'admin', 'Professor')

  const profCourses = courses
    .filter((c) => c.professorId === professorId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  return profCourses.map((course) => {
    const studentCount = enrollments.filter(
      (e) => e.courseId === course.id,
    ).length
    const assignmentCount = assignments.filter(
      (a) => a.courseId === course.id,
    ).length
    const groupCount = groups.filter((g) => g.courseId === course.id).length

    return {
      ...course,
      studentCount,
      assignmentCount,
      groupCount,
    }
  })
}

/**
 * Creates a new course for a professor.
 */
export async function createCourse(
  professorId: string,
  input: CourseInput,
): Promise<Course> {
  await simulateNetwork()
  const { users, courses } = getStorageData()

  const professor = users.find((u) => u.id === professorId)
  assertRole(professor, 'admin', 'Professor')

  const validationErrors = validateCourse(input)
  if (validationErrors.code) {
    throw new ApiError(validationErrors.code, 'VALIDATION')
  }
  if (validationErrors.name) {
    throw new ApiError(validationErrors.name, 'VALIDATION')
  }
  if (validationErrors.description) {
    throw new ApiError(validationErrors.description, 'VALIDATION')
  }
  if (validationErrors.semester) {
    throw new ApiError(validationErrors.semester, 'VALIDATION')
  }

  const rawCode = input.code ? input.code.trim() : ''
  const upperCode = rawCode.toUpperCase()
  const duplicate = courses.find(
    (c) =>
      c.professorId === professorId && c.code.toUpperCase() === upperCode,
  )
  if (duplicate) {
    throw new ApiError(
      `You already have a course with code "${upperCode}"`,
      'VALIDATION',
    )
  }

  const rawName = input.name ? input.name.trim() : ''
  const rawDesc = input.description ? input.description.trim() : ''
  const semester = input.semester?.trim() || 'Autumn 2026'

  const existingCodes = new Set(courses.map((c) => c.joinCode))
  const joinCode = generateJoinCode(existingCodes)

  const newCourse: Course = {
    id: `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    code: upperCode,
    name: rawName,
    description: rawDesc,
    semester,
    professorId,
    joinCode,
    createdAt: new Date().toISOString(),
  }

  const updatedCourses = [newCourse, ...courses]
  setCourses(updatedCourses)

  return newCourse
}

/**
 * Lists courses a student is enrolled in with professor details, assignments count,
 * completion progress, and active group.
 */
export async function listStudentCourses(
  studentId: string,
): Promise<StudentCourse[]> {
  await simulateNetwork()
  const {
    users,
    courses,
    enrollments,
    assignments,
    submissions,
    groups,
    groupAcks,
  } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  assertRole(student, 'student', 'Student')

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  const studentEnrollments = enrollments.filter(
    (e) => e.studentId === studentId,
  )
  const enrolledCourseIds = new Set(studentEnrollments.map((e) => e.courseId))

  const enrolledCourses = courses.filter((c) => enrolledCourseIds.has(c.id))

  return enrolledCourses.map((course) => {
    const profUser = users.find((u) => u.id === course.professorId)
    const professor: SafeUser = profUser
      ? toSafeUser(profUser)
      : {
          id: course.professorId,
          name: 'Unknown Professor',
          email: '',
          role: 'admin',
        }

    const courseAssignments = assignments.filter(
      (a) => a.courseId === course.id,
    )
    const assignmentCount = courseAssignments.length

    // Student's group in this course
    const studentGroup = groups.find(
      (g) => g.courseId === course.id && g.memberIds.includes(studentId),
    )
    const myGroup = studentGroup
      ? buildGroupDetail(studentGroup, usersMap)
      : null

    // Compute acknowledgedCount: individual submitted + group acknowledged for student's group
    let acknowledgedCount = 0
    for (const asg of courseAssignments) {
      if (asg.submissionType === 'individual') {
        const sub = submissions.find(
          (s) => s.assignmentId === asg.id && s.studentId === studentId,
        )
        if (sub?.status === 'submitted') {
          acknowledgedCount++
        }
      } else if (asg.submissionType === 'group' && studentGroup) {
        const ack = groupAcks.find(
          (ga) => ga.assignmentId === asg.id && ga.groupId === studentGroup.id,
        )
        if (ack) {
          acknowledgedCount++
        }
      }
    }

    return {
      ...course,
      professor,
      assignmentCount,
      acknowledgedCount,
      myGroup,
    }
  })
}

/**
 * Retrieves a single course. Accessible only to the course professor or enrolled students.
 * For unassigned users, returns NOT_FOUND to avoid leaking course existence.
 */
export async function getCourse(
  userId: string,
  courseId: string,
): Promise<{
  course: Course
  professor: SafeUser
  role: 'professor' | 'student'
}> {
  await simulateNetwork()
  const { users, courses, enrollments } = getStorageData()

  const user = users.find((u) => u.id === userId)
  if (!user) {
    throw new ApiError('User not found', 'NOT_FOUND')
  }

  const course = courses.find((c) => c.id === courseId)
  if (!course) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  const isProfessor = course.professorId === userId
  const isEnrolled = enrollments.some(
    (e) => e.courseId === courseId && e.studentId === userId,
  )

  if (!isProfessor && !isEnrolled) {
    // Never reveal course existence to outsiders
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  const profUser = users.find((u) => u.id === course.professorId)
  const professor = profUser ? toSafeUser(profUser) : toSafeUser(user)

  return {
    course,
    professor,
    role: isProfessor ? 'professor' : 'student',
  }
}

/**
 * Enrolls a student in a course using its join code.
 * Syncs assignment assignments and creates pending individual submissions.
 */
export async function joinCourseByCode(
  studentId: string,
  code: string,
): Promise<StudentCourse> {
  await simulateNetwork()
  const {
    users,
    courses,
    enrollments,
    assignments,
    submissions,
    groups,
    groupAcks,
  } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  if (!student) {
    throw new ApiError('User not found', 'NOT_FOUND')
  }
  if (student.role !== 'student') {
    throw new ApiError('Professors cannot enroll in courses', 'UNAUTHORIZED')
  }

  const inputNorm = normalizeCode(code || '')
  if (!inputNorm) {
    throw new ApiError('Please enter a course code', 'VALIDATION')
  }

  const matchedCourse = courses.find(
    (c) => normalizeCode(c.joinCode) === inputNorm,
  )
  if (!matchedCourse) {
    throw new ApiError('No course found with that code', 'NOT_FOUND')
  }

  const alreadyEnrolled = enrollments.some(
    (e) => e.courseId === matchedCourse.id && e.studentId === studentId,
  )
  if (alreadyEnrolled) {
    throw new ApiError('You\'re already enrolled in this course', 'VALIDATION')
  }

  // 1. Create enrollment
  const now = new Date().toISOString()
  const newEnrollment: Enrollment = {
    courseId: matchedCourse.id,
    studentId,
    enrolledAt: now,
  }
  setEnrollments([...enrollments, newEnrollment])

  // 2. Update existing course assignments and create individual submissions
  const updatedAssignments = assignments.map((asg) => {
    if (asg.courseId === matchedCourse.id) {
      if (!asg.assignedTo.includes(studentId)) {
        return {
          ...asg,
          assignedTo: [...asg.assignedTo, studentId],
          updatedAt: now,
        }
      }
    }
    return asg
  })
  setAssignments(updatedAssignments)

  const newSubmissions: Submission[] = []
  for (const asg of updatedAssignments) {
    if (
      asg.courseId === matchedCourse.id &&
      asg.submissionType === 'individual'
    ) {
      const exists = submissions.some(
        (s) => s.assignmentId === asg.id && s.studentId === studentId,
      )
      if (!exists) {
        newSubmissions.push({
          id: `sub-${asg.id}-${studentId}`,
          assignmentId: asg.id,
          studentId,
          status: 'not_submitted',
          submittedAt: null,
        })
      }
    }
  }
  if (newSubmissions.length > 0) {
    setSubmissions([...submissions, ...newSubmissions])
  }

  // 3. Return StudentCourse representation
  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  const profUser = users.find((u) => u.id === matchedCourse.professorId)
  const professor: SafeUser = profUser
    ? toSafeUser(profUser)
    : {
        id: matchedCourse.professorId,
        name: 'Unknown Professor',
        email: '',
        role: 'admin',
      }

  const courseAssignments = updatedAssignments.filter(
    (a) => a.courseId === matchedCourse.id,
  )
  const studentGroup = groups.find(
    (g) => g.courseId === matchedCourse.id && g.memberIds.includes(studentId),
  )

  let acknowledgedCount = 0
  const allSubmissions = [...submissions, ...newSubmissions]
  for (const asg of courseAssignments) {
    if (asg.submissionType === 'individual') {
      const sub = allSubmissions.find(
        (s) => s.assignmentId === asg.id && s.studentId === studentId,
      )
      if (sub?.status === 'submitted') {
        acknowledgedCount++
      }
    } else if (asg.submissionType === 'group' && studentGroup) {
      const ack = groupAcks.find(
        (ga) => ga.assignmentId === asg.id && ga.groupId === studentGroup.id,
      )
      if (ack) {
        acknowledgedCount++
      }
    }
  }

  return {
    ...matchedCourse,
    professor,
    assignmentCount: courseAssignments.length,
    acknowledgedCount,
    myGroup: studentGroup ? buildGroupDetail(studentGroup, usersMap) : null,
  }
}

/**
 * Lists all students enrolled in a course (course professor only).
 */
export async function listCourseStudents(
  professorId: string,
  courseId: string,
): Promise<SafeUser[]> {
  await simulateNetwork()
  const { users, courses, enrollments } = getStorageData()

  const course = courses.find((c) => c.id === courseId)
  if (!course || course.professorId !== professorId) {
    throw new ApiError('Course not found or unauthorized', 'NOT_FOUND')
  }

  const enrolledStudentIds = new Set(
    enrollments
      .filter((e) => e.courseId === courseId)
      .map((e) => e.studentId),
  )

  return users
    .filter((u) => enrolledStudentIds.has(u.id))
    .map(toSafeUser)
    .sort((a, b) => a.name.localeCompare(b.name))
}
