import {
  ApiError,
  getStorageData,
  setGroupAcks,
  setGroups,
  simulateNetwork,
  toSafeUser,
} from '@/services/api/core'
import { buildGroupDetail } from '@/services/api/courses'
import type { Group, GroupDetail, SafeUser } from '@/types'

/**
 * Lists all student groups in a course (newest first).
 * Accessible only to the course professor or enrolled students.
 */
export async function listCourseGroups(
  userId: string,
  courseId: string,
): Promise<GroupDetail[]> {
  await simulateNetwork()
  const { users, courses, enrollments, groups } = getStorageData()

  const course = courses.find((c) => c.id === courseId)
  if (!course) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  const isProfessor = course.professorId === userId
  const isEnrolled = enrollments.some(
    (e) => e.courseId === courseId && e.studentId === userId,
  )

  if (!isProfessor && !isEnrolled) {
    throw new ApiError('Course not found', 'NOT_FOUND')
  }

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  const courseGroups = groups
    .filter((g) => g.courseId === courseId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  return courseGroups.map((g) => buildGroupDetail(g, usersMap))
}

/**
 * Retrieves the active group for a student in a course, or null if ungrouped.
 */
export async function getMyGroup(
  studentId: string,
  courseId: string,
): Promise<GroupDetail | null> {
  await simulateNetwork()
  const { users, enrollments, groups } = getStorageData()

  const isEnrolled = enrollments.some(
    (e) => e.courseId === courseId && e.studentId === studentId,
  )
  if (!isEnrolled) {
    throw new ApiError('You are not enrolled in this course', 'UNAUTHORIZED')
  }

  const group = groups.find(
    (g) => g.courseId === courseId && g.memberIds.includes(studentId),
  )
  if (!group) return null

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  return buildGroupDetail(group, usersMap)
}

/**
 * Creates a new group in a course with the creator as the founding leader.
 */
export async function createGroup(
  studentId: string,
  courseId: string,
  name: string,
): Promise<GroupDetail> {
  await simulateNetwork()
  const { users, enrollments, groups } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  if (!student || student.role !== 'student') {
    throw new ApiError('Only students can create groups', 'UNAUTHORIZED')
  }

  const isEnrolled = enrollments.some(
    (e) => e.courseId === courseId && e.studentId === studentId,
  )
  if (!isEnrolled) {
    throw new ApiError('You are not enrolled in this course', 'VALIDATION')
  }

  const alreadyInGroup = groups.some(
    (g) => g.courseId === courseId && g.memberIds.includes(studentId),
  )
  if (alreadyInGroup) {
    throw new ApiError(
      'You are already in a group in this course',
      'VALIDATION',
    )
  }

  const trimmedName = name ? name.trim() : ''
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 40) {
    throw new ApiError(
      'Group name must be between 2 and 40 characters',
      'VALIDATION',
    )
  }

  const nameLower = trimmedName.toLowerCase()
  const duplicate = groups.find(
    (g) => g.courseId === courseId && g.name.trim().toLowerCase() === nameLower,
  )
  if (duplicate) {
    throw new ApiError(
      'That group name is already taken in this course',
      'VALIDATION',
    )
  }

  const newGroup: Group = {
    id: `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    courseId,
    name: trimmedName,
    leaderId: studentId,
    memberIds: [studentId],
    createdAt: new Date().toISOString(),
  }

  setGroups([newGroup, ...groups])

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  return buildGroupDetail(newGroup, usersMap)
}

/**
 * Adds an enrolled student to an existing course group.
 * A group acknowledgement belongs to the group, so members who join
 * later also see it as acknowledged.
 */
export async function joinGroup(
  studentId: string,
  groupId: string,
): Promise<GroupDetail> {
  await simulateNetwork()
  const { users, enrollments, groups } = getStorageData()

  const student = users.find((u) => u.id === studentId)
  if (!student || student.role !== 'student') {
    throw new ApiError('Only students can join groups', 'UNAUTHORIZED')
  }

  const groupIndex = groups.findIndex((g) => g.id === groupId)
  if (groupIndex === -1) {
    throw new ApiError('Group not found', 'NOT_FOUND')
  }

  const group = groups[groupIndex]

  const isEnrolled = enrollments.some(
    (e) => e.courseId === group.courseId && e.studentId === studentId,
  )
  if (!isEnrolled) {
    throw new ApiError('You are not enrolled in this course', 'VALIDATION')
  }

  const alreadyInGroup = groups.some(
    (g) => g.courseId === group.courseId && g.memberIds.includes(studentId),
  )
  if (alreadyInGroup) {
    throw new ApiError(
      'You are already in a group in this course',
      'VALIDATION',
    )
  }

  const updatedGroup: Group = {
    ...group,
    memberIds: [...group.memberIds, studentId],
  }

  const updatedGroups = [...groups]
  updatedGroups[groupIndex] = updatedGroup
  setGroups(updatedGroups)

  const usersMap = new Map<string, SafeUser>()
  for (const u of users) {
    usersMap.set(u.id, toSafeUser(u))
  }

  return buildGroupDetail(updatedGroup, usersMap)
}

/**
 * Removes a student from a group.
 * If non-leader leaves, removes from memberIds.
 * If leader leaves with other members remaining, leadership passes to earliest-joined member.
 * If leader was the sole member, deletes group and its acknowledgements.
 */
export async function leaveGroup(
  studentId: string,
  groupId: string,
): Promise<void> {
  await simulateNetwork()
  const { groups, groupAcks } = getStorageData()

  const groupIndex = groups.findIndex((g) => g.id === groupId)
  if (groupIndex === -1) {
    throw new ApiError('Group not found', 'NOT_FOUND')
  }

  const group = groups[groupIndex]
  if (!group.memberIds.includes(studentId)) {
    throw new ApiError('You are not a member of this group', 'VALIDATION')
  }

  if (group.leaderId !== studentId) {
    // Non-leader leaves: remove from members list
    const updatedGroup: Group = {
      ...group,
      memberIds: group.memberIds.filter((id) => id !== studentId),
    }
    const updatedGroups = [...groups]
    updatedGroups[groupIndex] = updatedGroup
    setGroups(updatedGroups)
    return
  }

  // Leader leaves
  const remaining = group.memberIds.filter((id) => id !== studentId)
  if (remaining.length > 0) {
    // Hand leadership to the next earliest joined member
    const newLeaderId = remaining[0]
    const updatedGroup: Group = {
      ...group,
      leaderId: newLeaderId,
      memberIds: remaining,
    }
    const updatedGroups = [...groups]
    updatedGroups[groupIndex] = updatedGroup
    setGroups(updatedGroups)
  } else {
    // Last member/leader left: delete group and associated group acknowledgements
    const updatedGroups = groups.filter((g) => g.id !== groupId)
    const updatedAcks = groupAcks.filter((ack) => ack.groupId !== groupId)
    setGroups(updatedGroups)
    setGroupAcks(updatedAcks)
  }
}
