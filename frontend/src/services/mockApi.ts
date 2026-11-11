/**
 * Barrel re-export for the ClassDesk mock API services.
 * Modular implementation lives under src/services/api/
 */

export * from '@/services/api/core'
export * from '@/services/api/auth'
export * from '@/services/api/courses'
export * from '@/services/api/groups'
export * from '@/services/api/assignments'
export * from '@/services/api/acknowledgements'

import {
  apiConfig,
  setApiConfig,
} from '@/services/api/core'
import {
  login,
  getUserById,
  listStudents,
} from '@/services/api/auth'
import {
  buildGroupDetail,
  listProfessorCourses,
  createCourse,
  listStudentCourses,
  getCourse,
  joinCourseByCode,
  listCourseStudents,
} from '@/services/api/courses'
import {
  listCourseGroups,
  getMyGroup,
  createGroup,
  joinGroup,
  leaveGroup,
} from '@/services/api/groups'
import {
  listCourseAssignments,
  createCourseAssignment,
  updateCourseAssignment,
  deleteCourseAssignment,
  getStudentAssignments,
  getAdminAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '@/services/api/assignments'
import {
  getStudentCourseAssignments,
  markSubmitted,
  acknowledgeGroupAssignment,
  getStudentCourseProgress,
} from '@/services/api/acknowledgements'

export const mockApi = {
  // Auth
  login,
  getUserById,
  listStudents,
  // Courses
  buildGroupDetail,
  listProfessorCourses,
  createCourse,
  listStudentCourses,
  getCourse,
  joinCourseByCode,
  listCourseStudents,
  // Groups
  listCourseGroups,
  getMyGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  // Course assignments
  listCourseAssignments,
  createCourseAssignment,
  updateCourseAssignment,
  deleteCourseAssignment,
  // Student course assignments & acks
  getStudentCourseAssignments,
  acknowledgeGroupAssignment,
  getStudentCourseProgress,
  // Legacy assignment methods
  getStudentAssignments,
  markSubmitted,
  getAdminAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  // Config
  apiConfig,
  setApiConfig,
}

export type MockApi = typeof mockApi
