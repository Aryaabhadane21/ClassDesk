import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi, ApiError } from '@/services/mockApi'
import { resetDemoData } from '@/services/storage'

describe('services/mockApi - Course, Group & Assignment Logic (Round 2)', () => {
  beforeEach(() => {
    resetDemoData()
  })

  describe('Course management', () => {
    it('listProfessorCourses returns courses for professor with aggregate counts', async () => {
      const courses = await mockApi.listProfessorCourses('user-admin-1')
      expect(courses.length).toBe(2)
      const webCourse = courses.find((c) => c.code === 'WEB101')
      expect(webCourse).toBeDefined()
      expect(webCourse?.name).toBe('Web Development')
      expect(webCourse?.studentCount).toBe(5)
      expect(webCourse?.assignmentCount).toBe(3)
      expect(webCourse?.groupCount).toBe(2)
    })

    it('createCourse validates inputs, prevents duplicate codes per professor, and generates joinCode', async () => {
      // Short code validation
      await expect(
        mockApi.createCourse('user-admin-1', {
          code: 'W',
          name: 'New Course',
          description: 'Valid description',
        }),
      ).rejects.toThrow(ApiError)

      // Duplicate code for the same professor
      await expect(
        mockApi.createCourse('user-admin-1', {
          code: 'WEB101',
          name: 'Another Web Course',
          description: 'Valid description',
        }),
      ).rejects.toThrow(ApiError)

      // Non-admin cannot create course
      await expect(
        mockApi.createCourse('user-student-1', {
          code: 'CS999',
          name: 'Student Course',
          description: 'Valid description',
        }),
      ).rejects.toThrow(ApiError)

      // Successful creation
      const created = await mockApi.createCourse('user-admin-1', {
        code: 'ENG101',
        name: 'Technical Writing',
        description: 'Writing clear docs',
        semester: 'Autumn 2026',
      })
      expect(created.id).toBeTruthy()
      expect(created.code).toBe('ENG101')
      expect(created.joinCode).toMatch(/^[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{4}$/)
    })

    it('getCourse enforces access boundaries (professor and enrolled students only)', async () => {
      // Professor can access
      const resProf = await mockApi.getCourse('user-admin-1', 'course-web101')
      expect(resProf.course.code).toBe('WEB101')
      expect(resProf.role).toBe('professor')

      // Enrolled student can access
      const resStudent = await mockApi.getCourse('user-student-1', 'course-web101')
      expect(resStudent.course.code).toBe('WEB101')
      expect(resStudent.role).toBe('student')

      // Non-enrolled student cannot access (Aarav is enrolled in web101, hci210, dsa201, but NOT osy301)
      await expect(
        mockApi.getCourse('user-student-1', 'course-osy301'),
      ).rejects.toThrow(ApiError)

      // Other professor cannot access
      await expect(
        mockApi.getCourse('user-admin-2', 'course-web101'),
      ).rejects.toThrow(ApiError)
    })

    it('listStudentCourses lists courses for student with progress and myGroup', async () => {
      const courses = await mockApi.listStudentCourses('user-student-1')
      expect(courses.length).toBeGreaterThan(0)
      const web = courses.find((c) => c.code === 'WEB101')
      expect(web).toBeDefined()
      expect(web?.professor.name).toBe('Prof. Meera Iyer')
      expect(web?.myGroup?.name).toBe('Team Alpha')
      expect(typeof web?.overdueCount).toBe('number')
      expect(typeof web?.dueSoonCount).toBe('number')
    })

    it('calculates overdueCount and dueSoonCount accurately for individual and group assignments', async () => {
      // For Aarav (user-student-1)
      const courses = await mockApi.listStudentCourses('user-student-1')
      // Aarav is in WEB101 (leader of Team Alpha), HCI210 (member of Design Guild), DSA201 (no group)
      const web = courses.find((c) => c.code === 'WEB101')
      const hci = courses.find((c) => c.code === 'HCI210')
      const dsa = courses.find((c) => c.code === 'DSA201')

      expect(web).toBeDefined()
      expect(hci).toBeDefined()
      expect(dsa).toBeDefined()

      // Aarav in WEB101:
      // asg-web-1 (indiv): submitted
      // asg-web-2 (group): acknowledged by Team Alpha (leader is Aarav) -> done, so not overdue
      // asg-web-3 (indiv, due 2026-11-20): not_submitted, future -> neither overdue nor due soon
      expect(web?.assignmentCount).toBe(3)
      expect(web?.acknowledgedCount).toBe(2)
      expect(web?.overdueCount).toBe(0)

      // Diya (user-student-2) is a member of Team Alpha in WEB101:
      // Group assignment acknowledged by leader (Aarav) counts as done for Diya too
      const diyaCourses = await mockApi.listStudentCourses('user-student-2')
      const diyaWeb = diyaCourses.find((c) => c.code === 'WEB101')
      expect(diyaWeb?.myGroup).toBeDefined()
      expect(diyaWeb?.myGroup?.name).toBe('Team Alpha')
      expect(diyaWeb?.myGroup?.leaderId).toBe('user-student-1')
      expect(diyaWeb?.acknowledgedCount).toBeGreaterThanOrEqual(1)

      // For a student with no group, group assignments are treated as uncompleted
      expect(dsa?.myGroup).toBeNull()
      // Any overdue assignment in dsa will contribute to overdueCount
      expect(dsa?.overdueCount).toBeGreaterThanOrEqual(0)
    })

    it('joinCourseByCode is case and dash tolerant, enrolls student, and seeds individual assignment submissions', async () => {
      // Ananya (user-student-4) is not in OSY301 (joinCode is OSY-5W8N)
      // Test with lowercase and no dash: "osy5w8n"
      const enrolledCourse = await mockApi.joinCourseByCode('user-student-4', 'osy5w8n')
      expect(enrolledCourse.code).toBe('OSY301')

      // Re-joining throws validation error
      await expect(
        mockApi.joinCourseByCode('user-student-4', 'OSY-5W8N'),
      ).rejects.toThrow(ApiError)

      // Student now appears in course assignments
      const studentAsgs = await mockApi.getStudentCourseAssignments('user-student-4', 'course-osy301')
      expect(studentAsgs.length).toBeGreaterThan(0)
      // Individual assignment should have status not_submitted
      const indAsg = studentAsgs.find((a) => a.assignment.submissionType === 'individual')
      expect(indAsg?.ack.acknowledged).toBe(false)
    })

    it('listCourseStudents returns safe user profiles of enrolled students', async () => {
      const students = await mockApi.listCourseStudents('user-admin-1', 'course-web101')
      expect(students.length).toBe(5)
      expect(students[0]).not.toHaveProperty('password')
    })
  })

  describe('Group management', () => {
    it('createGroup creates a group with creator as leader and prevents duplicate groups for a student in a course', async () => {
      // Aarav (user-student-1) is enrolled in DSA201 but has no group in DSA201
      const group = await mockApi.createGroup('user-student-1', 'course-dsa201', 'Algorithm Knights')
      expect(group.name).toBe('Algorithm Knights')
      expect(group.leader.id).toBe('user-student-1')
      expect(group.members.length).toBe(1)

      // Creating a second group in the same course should fail
      await expect(
        mockApi.createGroup('user-student-1', 'course-dsa201', 'Another Group'),
      ).rejects.toThrow(ApiError)

      // Duplicate group name in same course should fail
      // Kabir (user-student-5) creates a group in OSY301 (where he is enrolled without a group)
      const osyGroup = await mockApi.createGroup('user-student-5', 'course-osy301', 'Kernel Hackers')
      expect(osyGroup.name).toBe('Kernel Hackers')

      // Duplicate name should fail
      await expect(
        mockApi.createGroup('user-student-5', 'course-osy301', 'Kernel Hackers'),
      ).rejects.toThrow(ApiError)
    })

    it('joinGroup adds student to group and prevents joining multiple groups in the course', async () => {
      // Aarav (user-student-1) is in DSA201 without a group. grp-dsa-pals is in DSA201.
      const updated = await mockApi.joinGroup('user-student-1', 'grp-dsa-pals')
      expect(updated.members.some((m) => m.id === 'user-student-1')).toBe(true)

      // Trying to join again or join another group in DSA201 fails
      await expect(
        mockApi.joinGroup('user-student-1', 'grp-dsa-pals'),
      ).rejects.toThrow(ApiError)
    })

    it('leaveGroup allows regular member to leave, transfers leadership if leader leaves, and deletes group when sole member leaves', async () => {
      // Diya (user-student-2) is a regular member in grp-web-alpha (leader is user-student-1)
      await mockApi.leaveGroup('user-student-2', 'grp-web-alpha')
      const groupsAfter = await mockApi.listCourseGroups('user-admin-1', 'course-web101')
      const alpha = groupsAfter.find((g) => g.id === 'grp-web-alpha')
      expect(alpha?.members.some((m) => m.id === 'user-student-2')).toBe(false)
      expect(alpha?.leader.id).toBe('user-student-1')

      // Now leader (user-student-1) leaves; leadership should pass to Rohan (user-student-3)
      await mockApi.leaveGroup('user-student-1', 'grp-web-alpha')
      const groupsAfterLeader = await mockApi.listCourseGroups('user-admin-1', 'course-web101')
      const alphaNew = groupsAfterLeader.find((g) => g.id === 'grp-web-alpha')
      expect(alphaNew?.leader.id).toBe('user-student-3')

      // Rohan leaves as the sole remaining member; group should be deleted
      await mockApi.leaveGroup('user-student-3', 'grp-web-alpha')
      const groupsFinal = await mockApi.listCourseGroups('user-admin-1', 'course-web101')
      expect(groupsFinal.some((g) => g.id === 'grp-web-alpha')).toBe(false)
    })
  })

  describe('Course assignment CRUD and tracking', () => {
    it('creates individual course assignment and initializes submissions for all enrolled students', async () => {
      const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
        title: 'New Individual Project',
        description: 'Build a full stack web page with proper state management',
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        oneDriveLink: 'https://onedrive.live.com/test-link',
        submissionType: 'individual',
        assignedTo: 'all',
      })

      expect(created.assignment.title).toBe('New Individual Project')
      expect(created.tracking.kind).toBe('individual')
      if (created.tracking.kind === 'individual') {
        expect(created.tracking.total).toBe(5)
        expect(created.tracking.submitted).toBe(0)
        expect(created.tracking.entries.length).toBe(5)
      }
    })

    it('creates group course assignment with group tracking and ungrouped students', async () => {
      const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
        title: 'New Group Project',
        description: 'Collaborative sprint in groups of two or more',
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        oneDriveLink: 'https://onedrive.live.com/group-test-link',
        submissionType: 'group',
        assignedTo: 'all',
      })

      expect(created.assignment.submissionType).toBe('group')
      expect(created.tracking.kind).toBe('group')
      if (created.tracking.kind === 'group') {
        expect(created.tracking.total).toBe(2)
        expect(created.tracking.submitted).toBe(0)
        expect(created.tracking.ungroupedStudents.length).toBe(0) // in web101 all 5 students are grouped initially
      }
    })

    it('listCourseAssignments returns assignments ordered by dueDate with tracking matrix', async () => {
      const list = await mockApi.listCourseAssignments('user-admin-1', 'course-web101')
      expect(list.length).toBe(3)
      // Sorted by dueDate asc
      const d1 = new Date(list[0].assignment.dueDate).getTime()
      const d2 = new Date(list[1].assignment.dueDate).getTime()
      expect(d1).toBeLessThanOrEqual(d2)

      // asg-web-01 is individual; asg-web-02 is group
      const ind = list.find((a) => a.assignment.submissionType === 'individual')
      expect(ind?.tracking.kind).toBe('individual')

      const grp = list.find((a) => a.assignment.submissionType === 'group')
      expect(grp?.tracking.kind).toBe('group')
    })

    it('prevents changing submissionType after submissions or acknowledgements have started', async () => {
      // asg-web-01 has submissions from Aarav and Diya
      await expect(
        mockApi.updateCourseAssignment('user-admin-1', 'asg-web-01', {
          title: 'HTML & CSS Portfolio Update',
          description: 'Updated description',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          oneDriveLink: 'https://onedrive.live.com/valid',
          submissionType: 'group',
          assignedTo: 'all',
        }),
      ).rejects.toThrow("The submission type can't be changed after submissions have started")
    })

    it('allows changing submissionType if no submissions exist yet', async () => {
      // Create a fresh assignment with no submissions
      const created = await mockApi.createCourseAssignment('user-admin-1', 'course-web101', {
        title: 'Empty Assignment',
        description: 'No submissions yet',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        oneDriveLink: 'https://onedrive.live.com/test',
        submissionType: 'individual',
        assignedTo: 'all',
      })

      // Change to group
      const updated = await mockApi.updateCourseAssignment(
        'user-admin-1',
        created.assignment.id,
        {
          title: 'Empty Assignment Now Group',
          description: 'Now a group project',
          dueDate: created.assignment.dueDate,
          oneDriveLink: created.assignment.oneDriveLink,
          submissionType: 'group',
          assignedTo: 'all',
        },
      )
      expect(updated.assignment.submissionType).toBe('group')
      expect(updated.tracking.kind).toBe('group')
    })

    it('deleteCourseAssignment removes assignment and purges submissions and group acks', async () => {
      await mockApi.deleteCourseAssignment('user-admin-1', 'asg-web-02')
      const list = await mockApi.listCourseAssignments('user-admin-1', 'course-web101')
      expect(list.some((a) => a.assignment.id === 'asg-web-02')).toBe(false)
    })
  })

  describe('Student course assignments, acknowledgements and progress', () => {
    it('getStudentCourseAssignments returns assignments with ack status and group state', async () => {
      // Aarav (user-student-1) is leader of grp-web-alpha in web101
      const asgs = await mockApi.getStudentCourseAssignments('user-student-1', 'course-web101')
      expect(asgs.length).toBe(3)

      const ind = asgs.find((a) => a.assignment.id === 'asg-web-01')
      expect(ind?.ack.acknowledged).toBe(true)

      const grp = asgs.find((a) => a.assignment.id === 'asg-web-02')
      expect(grp?.group?.state).toBe('leader')
      expect(grp?.group?.canAcknowledge).toBe(false) // already acknowledged by leader in seed data
      expect(grp?.ack.acknowledged).toBe(true)
    })

    it('markSubmitted rejects group assignment with validation error', async () => {
      await expect(
        mockApi.markSubmitted('user-student-1', 'asg-web-02'),
      ).rejects.toThrow('This is a group assignment. Only the group leader can acknowledge it.')
    })

    it('acknowledgeGroupAssignment enforces leader authorization and idempotency', async () => {
      // Diya (user-student-2) is non-leader in grp-web-alpha
      await expect(
        mockApi.acknowledgeGroupAssignment('user-student-2', 'asg-web-02'),
      ).rejects.toThrow('Only the group leader can acknowledge this assignment')

      // Aarav (user-student-1) is enrolled in DSA201 but has no group in DSA201
      await expect(
        mockApi.acknowledgeGroupAssignment('user-student-1', 'asg-dsa-02'),
      ).rejects.toThrow('You are not part of any group in this course')

      // Leader acknowledging is successful and idempotent
      // Ananya (user-student-4) is leader of grp-web-beta for asg-web-02 (not yet acknowledged in seed data)
      const ack = await mockApi.acknowledgeGroupAssignment('user-student-4', 'asg-web-02')
      expect(ack.acknowledged).toBe(true)
      expect(ack.acknowledgedBy?.name).toBe('Ananya Reddy')

      // Second call returns existing ack without error
      const ackAgain = await mockApi.acknowledgeGroupAssignment('user-student-4', 'asg-web-02')
      expect(ackAgain.acknowledged).toBe(true)

      // The acknowledgement should propagate to group member Kabir (user-student-5)
      const kabirAsgs = await mockApi.getStudentCourseAssignments('user-student-5', 'course-web101')
      const kabirGrp = kabirAsgs.find((a) => a.assignment.id === 'asg-web-02')
      expect(kabirGrp?.ack.acknowledged).toBe(true)
      expect(kabirGrp?.ack.acknowledgedBy?.name).toBe('Ananya Reddy')
    })

    it('getStudentCourseProgress calculates total and acknowledged count accurately', async () => {
      const progress = await mockApi.getStudentCourseProgress('user-student-1', 'course-web101')
      expect(progress.total).toBe(3)
      expect(progress.acknowledged).toBe(2) // asg-web-01 and asg-web-02 acknowledged; asg-web-03 not submitted
    })
  })
})
