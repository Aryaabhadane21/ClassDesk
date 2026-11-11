import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi, ApiError } from '@/services/mockApi'
import { resetDemoData } from '@/services/storage'

describe('Unit: Course Assignment Audience & Student Selection API (Round 2 Step 8)', () => {
  beforeEach(() => {
    resetDemoData()
  })

  it('creates an individual assignment for all enrolled students', async () => {
    // In WEB101, all 5 students (s1..s5) are enrolled
    const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
      title: 'Individual All Assignment',
      description: 'Applicable to every enrolled student',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      oneDriveLink: 'https://1drv.ms/f/s!sample-all',
      submissionType: 'individual',
      assignedTo: 'all',
    })

    expect(created.assignment.audience).toBe('all')
    expect(created.assignment.assignedTo.length).toBe(5)
    expect(created.tracking.kind).toBe('individual')
    if (created.tracking.kind === 'individual') {
      expect(created.tracking.total).toBe(5)
      expect(created.tracking.submitted).toBe(0)
      expect(created.tracking.entries.length).toBe(5)
    }
  })

  it('creates an individual assignment for selected students only', async () => {
    const selectedStudents = ['user-student-1', 'user-student-2']
    const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
      title: 'Individual Selected Assignment',
      description: 'Only for Aarav and Diya',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      oneDriveLink: 'https://1drv.ms/f/s!sample-selected',
      submissionType: 'individual',
      assignedTo: selectedStudents,
    })

    expect(created.assignment.audience).toBe('selected')
    expect(created.assignment.assignedTo).toEqual(selectedStudents)
    if (created.tracking.kind === 'individual') {
      expect(created.tracking.total).toBe(2)
      expect(created.tracking.entries.length).toBe(2)
      expect(created.tracking.entries.map((e) => e.student.id).sort()).toEqual(selectedStudents.sort())
    }
  })

  it('rejects creating an individual assignment with empty selection or unenrolled students', async () => {
    // Empty list
    await expect(
      mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
        title: 'Empty Selection',
        description: 'Should fail',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        oneDriveLink: 'https://1drv.ms/f/s!test',
        submissionType: 'individual',
        assignedTo: [],
      }),
    ).rejects.toThrow('Select at least one student')

    // Unenrolled student (user-admin-2 or unknown student)
    await expect(
      mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
        title: 'Unenrolled Selection',
        description: 'Should fail',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        oneDriveLink: 'https://1drv.ms/f/s!test',
        submissionType: 'individual',
        assignedTo: ['user-student-1', 'user-student-unknown'],
      }),
    ).rejects.toThrow('Some selected students are not enrolled in this course')
  })

  it('rejects group assignment if student list is passed and enforces audience all', async () => {
    await expect(
      mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
        title: 'Group With List',
        description: 'Should fail',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        oneDriveLink: 'https://1drv.ms/f/s!test',
        submissionType: 'group',
        assignedTo: ['user-student-1'],
      }),
    ).rejects.toThrow('Group assignments go to every group in the course')

    // Valid group creation
    const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
      title: 'Valid Group',
      description: 'Goes to all groups',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      oneDriveLink: 'https://1drv.ms/f/s!test',
      submissionType: 'group',
      assignedTo: 'all',
    })
    expect(created.assignment.audience).toBe('all')
    expect(created.assignment.assignedTo.length).toBe(5)
  })

  it('updates selection on individual assignment, creating and removing submission records accordingly', async () => {
    // 1. Create with s1 and s2
    const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
      title: 'Dynamic Selection Assignment',
      description: 'Initial selection s1 and s2',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      oneDriveLink: 'https://1drv.ms/f/s!dyn',
      submissionType: 'individual',
      assignedTo: ['user-student-1', 'user-student-2'],
    })

    // Aarav (s1) submits
    await mockApi.markSubmitted('user-student-1', created.assignment.id)

    // 2. Update selection: remove s1 (who submitted!), keep s2, add s3
    const updated = await mockApi.updateCourseAssignment('user-admin-1', created.assignment.id, {
      title: 'Dynamic Selection Assignment',
      description: 'Updated selection s2 and s3',
      dueDate: created.assignment.dueDate,
      oneDriveLink: created.assignment.oneDriveLink,
      submissionType: 'individual',
      assignedTo: ['user-student-2', 'user-student-3'],
    })

    expect(updated.assignment.assignedTo).toEqual(['user-student-2', 'user-student-3'])
    if (updated.tracking.kind === 'individual') {
      expect(updated.tracking.total).toBe(2)
      // s1's submission was purged when removed, so submitted is 0
      expect(updated.tracking.submitted).toBe(0)
      expect(updated.tracking.entries.map((e) => e.student.id).sort()).toEqual(
        ['user-student-2', 'user-student-3'].sort(),
      )
    }

    // s1 no longer sees this assignment in their student list
    const s1Asgs = await mockApi.getStudentCourseAssignments('user-student-1', 'course-web101')
    expect(s1Asgs.some((a) => a.assignment.id === created.assignment.id)).toBe(false)

    // s3 now sees this assignment
    const s3Asgs = await mockApi.getStudentCourseAssignments('user-student-3', 'course-web101')
    expect(s3Asgs.some((a) => a.assignment.id === created.assignment.id)).toBe(true)
  })

  it('switches between all and selected audiences seamlessly', async () => {
    // Create selected with s1, s2
    const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
      title: 'Switching Assignment',
      description: 'Will switch from selected to all',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      oneDriveLink: 'https://1drv.ms/f/s!switch',
      submissionType: 'individual',
      assignedTo: ['user-student-1', 'user-student-2'],
    })
    expect(created.assignment.audience).toBe('selected')
    if (created.tracking.kind === 'individual') {
      expect(created.tracking.total).toBe(2)
    }

    // Switch to 'all'
    const toAll = await mockApi.updateCourseAssignment('user-admin-1', created.assignment.id, {
      title: 'Switching Assignment',
      description: 'Now all students',
      dueDate: created.assignment.dueDate,
      oneDriveLink: created.assignment.oneDriveLink,
      submissionType: 'individual',
      assignedTo: 'all',
    })
    expect(toAll.assignment.audience).toBe('all')
    if (toAll.tracking.kind === 'individual') {
      expect(toAll.tracking.total).toBe(5)
    }

    // Switch back to 'selected' with only s4
    const toSelected = await mockApi.updateCourseAssignment('user-admin-1', created.assignment.id, {
      title: 'Switching Assignment',
      description: 'Now only s4',
      dueDate: created.assignment.dueDate,
      oneDriveLink: created.assignment.oneDriveLink,
      submissionType: 'individual',
      assignedTo: ['user-student-4'],
    })
    expect(toSelected.assignment.audience).toBe('selected')
    if (toSelected.tracking.kind === 'individual') {
      expect(toSelected.tracking.total).toBe(1)
    }
  })

  it('later joiners are automatically included in audience all assignments, but not in selected assignments', async () => {
    // Maya Sen (user-student-new) is not yet enrolled in WEB101 or OSY301
    // Let's test with course-osy301:
    // Create one 'all' assignment and one 'selected' assignment in OSY301
    const allAsg = await mockApi.createCourseAssignment('user-admin-2', 'course-osy301', {
      title: 'OSY All Joiner Test',
      description: 'All enrolled students',
      dueDate: new Date(Date.now() + 86400000 * 8).toISOString(),
      oneDriveLink: 'https://1drv.ms/f/s!osy-all',
      submissionType: 'individual',
      assignedTo: 'all',
    })

    const selectedAsg = await mockApi.createCourseAssignment('user-admin-2', 'course-osy301', {
      title: 'OSY Selected Joiner Test',
      description: 'Only current students s2 and s3',
      dueDate: new Date(Date.now() + 86400000 * 8).toISOString(),
      oneDriveLink: 'https://1drv.ms/f/s!osy-sel',
      submissionType: 'individual',
      assignedTo: ['user-student-2', 'user-student-3'],
    })

    // Aarav (user-student-1) joins OSY301 (joinCode: OSY-5W8N)
    await mockApi.joinCourseByCode('user-student-1', 'OSY-5W8N')

    // Aarav should now see allAsg, but NOT selectedAsg
    const aaravOsyAsgs = await mockApi.getStudentCourseAssignments('user-student-1', 'course-osy301')
    expect(aaravOsyAsgs.some((a) => a.assignment.id === allAsg.assignment.id)).toBe(true)
    expect(aaravOsyAsgs.some((a) => a.assignment.id === selectedAsg.assignment.id)).toBe(false)
  })

  it('student course progress and listStudentCourses only count applicable assignments', async () => {
    // In WEB101, asg-web-03 is selected for s1, s2, s4 (excluding s3 and s5)
    // For Rohan (user-student-3), asg-web-03 does not apply
    const rohanCourses = await mockApi.listStudentCourses('user-student-3')
    const rohanWeb = rohanCourses.find((c) => c.code === 'WEB101')
    // Rohan in WEB101 sees asg-web-01 and asg-web-02 (2 assignments, not 3)
    expect(rohanWeb?.assignmentCount).toBe(2)

    const rohanProgress = await mockApi.getStudentCourseProgress('user-student-3', 'course-web101')
    expect(rohanProgress.total).toBe(2)

    // Aarav (user-student-1) was selected in asg-web-03, so he has 3 assignments
    const aaravCourses = await mockApi.listStudentCourses('user-student-1')
    const aaravWeb = aaravCourses.find((c) => c.code === 'WEB101')
    expect(aaravWeb?.assignmentCount).toBe(3)

    const aaravProgress = await mockApi.getStudentCourseProgress('user-student-1', 'course-web101')
    expect(aaravProgress.total).toBe(3)
  })
})
