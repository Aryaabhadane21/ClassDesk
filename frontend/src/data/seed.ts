import type {
  Assignment,
  Course,
  Enrollment,
  Group,
  GroupAcknowledgement,
  Submission,
  User,
} from '@/types'

/**
 * Shared demo password for all seeded users.
 * NOTE: Mock authentication only for client-side evaluation; no real authentication backend.
 */
export const DEMO_PASSWORD = 'demo1234'

/**
 * Seed administrative (Professor) and student accounts.
 * Exact 7 user accounts preserved for demo stability.
 */
export const SEED_USERS: User[] = [
  // Professors (role: 'admin' internally)
  {
    id: 'user-admin-1',
    name: 'Prof. Meera Iyer',
    email: 'meera.iyer@classdesk.edu',
    password: DEMO_PASSWORD,
    role: 'admin',
  },
  {
    id: 'user-admin-2',
    name: 'Prof. Arjun Mehta',
    email: 'arjun.mehta@classdesk.edu',
    password: DEMO_PASSWORD,
    role: 'admin',
  },
  // Students
  {
    id: 'user-student-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@classdesk.edu',
    password: DEMO_PASSWORD,
    role: 'student',
  },
  {
    id: 'user-student-2',
    name: 'Diya Patel',
    email: 'diya.patel@classdesk.edu',
    password: DEMO_PASSWORD,
    role: 'student',
  },
  {
    id: 'user-student-3',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@classdesk.edu',
    password: DEMO_PASSWORD,
    role: 'student',
  },
  {
    id: 'user-student-4',
    name: 'Ananya Reddy',
    email: 'ananya.reddy@classdesk.edu',
    password: DEMO_PASSWORD,
    role: 'student',
  },
  {
    id: 'user-student-5',
    name: 'Kabir Singh',
    email: 'kabir.singh@classdesk.edu',
    password: DEMO_PASSWORD,
    role: 'student',
  },
]

/**
 * 4 Seed courses for Autumn 2026 semester
 */
export const SEED_COURSES: Course[] = [
  {
    id: 'course-web101',
    code: 'WEB101',
    name: 'Web Development',
    description:
      'Master modern frontend engineering using semantic HTML, responsive CSS architecture, and scalable component systems in React.',
    semester: 'Autumn 2026',
    professorId: 'user-admin-1',
    joinCode: 'WEB-4K7P',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'course-hci210',
    code: 'HCI210',
    name: 'Human-Computer Interaction',
    description:
      'Explore interaction design heuristics, cognitive modeling, WCAG accessibility evaluations, and high-fidelity interactive prototyping.',
    semester: 'Autumn 2026',
    professorId: 'user-admin-1',
    joinCode: 'HCI-9M2X',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'course-dsa201',
    code: 'DSA201',
    name: 'Data Structures',
    description:
      'Rigorous analysis of fundamental and advanced data structures, self-balancing search trees, graph traversals, and dynamic programming.',
    semester: 'Autumn 2026',
    professorId: 'user-admin-2',
    joinCode: 'DSA-7R3T',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'course-osy301',
    code: 'OSY301',
    name: 'Operating Systems',
    description:
      'Investigate core OS mechanisms including virtual memory management, thread synchronization, file systems, and concurrent architectures.',
    semester: 'Autumn 2026',
    professorId: 'user-admin-2',
    joinCode: 'OSY-5W8N',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
]

/**
 * Course enrollments:
 * - Every student is enrolled in 2 or 3 courses.
 * - Every course has at least 3 students.
 * - WEB101 includes all 5 students (Aarav, Diya, Rohan, Ananya, Kabir).
 */
export const SEED_ENROLLMENTS: Enrollment[] = [
  // WEB101 (all 5 students)
  { courseId: 'course-web101', studentId: 'user-student-1', enrolledAt: new Date(Date.now() - 28 * 86400000).toISOString() },
  { courseId: 'course-web101', studentId: 'user-student-2', enrolledAt: new Date(Date.now() - 28 * 86400000).toISOString() },
  { courseId: 'course-web101', studentId: 'user-student-3', enrolledAt: new Date(Date.now() - 28 * 86400000).toISOString() },
  { courseId: 'course-web101', studentId: 'user-student-4', enrolledAt: new Date(Date.now() - 28 * 86400000).toISOString() },
  { courseId: 'course-web101', studentId: 'user-student-5', enrolledAt: new Date(Date.now() - 28 * 86400000).toISOString() },

  // HCI210 (3 students: Aarav, Diya, Kabir)
  { courseId: 'course-hci210', studentId: 'user-student-1', enrolledAt: new Date(Date.now() - 27 * 86400000).toISOString() },
  { courseId: 'course-hci210', studentId: 'user-student-2', enrolledAt: new Date(Date.now() - 27 * 86400000).toISOString() },
  { courseId: 'course-hci210', studentId: 'user-student-5', enrolledAt: new Date(Date.now() - 27 * 86400000).toISOString() },

  // DSA201 (3 students: Aarav, Rohan, Ananya)
  { courseId: 'course-dsa201', studentId: 'user-student-1', enrolledAt: new Date(Date.now() - 27 * 86400000).toISOString() },
  { courseId: 'course-dsa201', studentId: 'user-student-3', enrolledAt: new Date(Date.now() - 27 * 86400000).toISOString() },
  { courseId: 'course-dsa201', studentId: 'user-student-4', enrolledAt: new Date(Date.now() - 27 * 86400000).toISOString() },

  // OSY301 (3 students: Diya, Rohan, Kabir)
  { courseId: 'course-osy301', studentId: 'user-student-2', enrolledAt: new Date(Date.now() - 26 * 86400000).toISOString() },
  { courseId: 'course-osy301', studentId: 'user-student-3', enrolledAt: new Date(Date.now() - 26 * 86400000).toISOString() },
  { courseId: 'course-osy301', studentId: 'user-student-5', enrolledAt: new Date(Date.now() - 26 * 86400000).toISOString() },
]

/**
 * Course groups:
 * - One group per student per course at most.
 * - In WEB101:
 *   - "Team Alpha" (leader: Aarav; members: Aarav, Diya, Rohan)
 *   - "Team Beta" (leader: Ananya; members: Ananya, Kabir)
 * - In DSA201:
 *   - "Pointer Pals" (leader: Rohan; members: Rohan, Ananya)
 *   - Aarav is enrolled in DSA201 but has NO group.
 * - In HCI210 & OSY301: no groups exist yet (demonstrating students enrolled with no group).
 */
export const SEED_GROUPS: Group[] = [
  {
    id: 'grp-web-alpha',
    courseId: 'course-web101',
    name: 'Team Alpha',
    leaderId: 'user-student-1',
    memberIds: ['user-student-1', 'user-student-2', 'user-student-3'],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'grp-web-beta',
    courseId: 'course-web101',
    name: 'Team Beta',
    leaderId: 'user-student-4',
    memberIds: ['user-student-4', 'user-student-5'],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'grp-dsa-pals',
    courseId: 'course-dsa201',
    name: 'Pointer Pals',
    leaderId: 'user-student-3',
    memberIds: ['user-student-3', 'user-student-4'],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
]

/**
 * Helper to compute an ISO date string at 23:59:00 local time relative to now.
 */
function getRelativeDueDate(daysOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  d.setHours(23, 59, 0, 0)
  return d.toISOString()
}

/**
 * Helper to generate relative submission timestamps relative to a due date string.
 */
function getSubmissionDate(dueDateStr: string, hoursOffset: number): string {
  const d = new Date(dueDateStr)
  d.setHours(d.getHours() + hoursOffset)
  return d.toISOString()
}

/**
 * Generate fresh seed data including courses, enrollments, groups,
 * group acknowledgements, assignments, and submissions.
 * Relative dates are calculated dynamically at the time of seeding.
 */
export function generateSeedData(): {
  users: User[]
  courses: Course[]
  enrollments: Enrollment[]
  groups: Group[]
  groupAcks: GroupAcknowledgement[]
  assignments: Assignment[]
  submissions: Submission[]
} {
  const now = new Date().toISOString()

  // 12 assignments (3 per course):
  // WEB101 (Prof. Meera Iyer, assignedTo: s1..s5)
  // HCI210 (Prof. Meera Iyer, assignedTo: s1, s2, s5)
  // DSA201 (Prof. Arjun Mehta, assignedTo: s1, s3, s4)
  // OSY301 (Prof. Arjun Mehta, assignedTo: s2, s3, s5)
  //
  // Mix: 6 group assignments (at least 5 required, at least 1 in WEB101, at least 1 in DSA201).
  // Deadlines:
  // - 3 Overdue: asg-web-01 (-5d), asg-web-02 (-2d), asg-hci-01 (-3d)
  // - 3 Due within 3 days: asg-hci-02 (+1d), asg-web-03 (+2d), asg-dsa-01 (+3d)
  // - 6 Due 5-20 days out: asg-osy-01 (+5d), asg-dsa-02 (+6d), asg-hci-03 (+9d),
  //                        asg-dsa-03 (+12d), asg-osy-02 (+15d), asg-osy-03 (+20d)

  const assignments: Assignment[] = [
    // --- WEB101 (Prof. Meera Iyer) ---
    {
      id: 'asg-web-01',
      courseId: 'course-web101',
      submissionType: 'individual',
      title: 'Responsive Portfolio Website',
      description:
        'Develop a multi-page personal portfolio showcasing your modern frontend projects. Ensure semantic HTML5, fluid responsive layouts across mobile and desktop breakpoints, and WCAG AA accessibility standards. Provide complete CSS architecture and lighthouse audit reports.',
      dueDate: getRelativeDueDate(-5), // Overdue by 5 days
      oneDriveLink: 'https://1drv.ms/f/s!Am1-web101-portfolio-turnin',
      createdBy: 'user-admin-1',
      assignedTo: ['user-student-1', 'user-student-2', 'user-student-3', 'user-student-4', 'user-student-5'],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-web-02',
      courseId: 'course-web101',
      submissionType: 'group',
      title: 'Team Project: Collaborative Task Board',
      description:
        'Collaborate as a team to architect an interactive Kanban task board with optimistic UI updates, drag-and-drop mechanics, and tag filtering. Ensure shared team coordination and clean Git branching workflows across components. Submit your team documentation and live OneDrive workspace.',
      dueDate: getRelativeDueDate(-2), // Overdue by 2 days (Group assignment in WEB101)
      oneDriveLink: 'https://1drv.ms/f/s!Am2-web101-kanban-turnin',
      createdBy: 'user-admin-1',
      assignedTo: ['user-student-1', 'user-student-2', 'user-student-3', 'user-student-4', 'user-student-5'],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-web-03',
      courseId: 'course-web101',
      submissionType: 'individual',
      title: 'RESTful API Integration & Dashboard',
      description:
        'Connect a React dashboard to a third-party REST API with query parameter filtering, debounced search, and pagination. Handle network latency, loading skeletons, and custom retry logic for transient errors. Include interactive data visualization widgets.',
      dueDate: getRelativeDueDate(2), // Due within 2 days
      oneDriveLink: 'https://1drv.ms/f/s!Am3-web101-dashboard-turnin',
      createdBy: 'user-admin-1',
      assignedTo: ['user-student-1', 'user-student-2', 'user-student-3', 'user-student-4', 'user-student-5'],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: now,
    },

    // --- HCI210 (Prof. Meera Iyer) ---
    {
      id: 'asg-hci-01',
      courseId: 'course-hci210',
      submissionType: 'individual',
      title: 'Heuristic Usability Evaluation',
      description:
        'Conduct an in-depth heuristic evaluation of an existing web service using Nielsens ten usability principles. Document severe usability friction points, assess severity ratings, and recommend actionable design remedies. Support findings with annotated screen captures.',
      dueDate: getRelativeDueDate(-3), // Overdue by 3 days
      oneDriveLink: 'https://1drv.ms/f/s!Am4-hci210-heuristic-turnin',
      createdBy: 'user-admin-1',
      assignedTo: ['user-student-1', 'user-student-2', 'user-student-5'],
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-hci-02',
      courseId: 'course-hci210',
      submissionType: 'group',
      title: 'Accessibility Audit & Inclusive Design System',
      description:
        'Audit an educational portal against WCAG 2.1 AA criteria using automated screen readers and manual keyboard navigation tests. Create an inclusive design pattern token library with high contrast pairings and accessible focus indicators. Summarize team findings in a shared report.',
      dueDate: getRelativeDueDate(1), // Due tomorrow (Group assignment)
      oneDriveLink: 'https://1drv.ms/f/s!Am5-hci210-accessibility-turnin',
      createdBy: 'user-admin-1',
      assignedTo: ['user-student-1', 'user-student-2', 'user-student-5'],
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-hci-03',
      courseId: 'course-hci210',
      submissionType: 'group',
      title: 'Interactive Prototype & Think-Aloud User Study',
      description:
        'Synthesize user research findings into interactive high-fidelity user workflows. Run moderated think-aloud usability sessions with representative participants, synthesize qualitative feedback into thematic affinity maps, and iterate on key friction screens.',
      dueDate: getRelativeDueDate(9), // Due in 9 days (Group assignment)
      oneDriveLink: 'https://1drv.ms/f/s!Am6-hci210-prototype-turnin',
      createdBy: 'user-admin-1',
      assignedTo: ['user-student-1', 'user-student-2', 'user-student-5'],
      createdAt: now,
      updatedAt: now,
    },

    // --- DSA201 (Prof. Arjun Mehta) ---
    {
      id: 'asg-dsa-01',
      courseId: 'course-dsa201',
      submissionType: 'individual',
      title: 'Binary Search Tree & AVL Balancing',
      description:
        'Construct self-balancing AVL search trees from scratch in TypeScript with recursive node insertions and deletions. Include in-order, pre-order, and level-order traversal visitors alongside automated height balance recalculations. Measure rotational overhead against standard BSTs.',
      dueDate: getRelativeDueDate(3), // Due in 3 days
      oneDriveLink: 'https://1drv.ms/f/s!Am7-dsa201-avl-turnin',
      createdBy: 'user-admin-2',
      assignedTo: ['user-student-1', 'user-student-3', 'user-student-4'],
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-dsa-02',
      courseId: 'course-dsa201',
      submissionType: 'group',
      title: 'Distributed Cache & Hash Ring System',
      description:
        'Design and simulate a consistent hashing ring supporting dynamic node joins, node failures, and key distribution with replication factor k. Benchmark load skew across vnodes and measure failover latency under synthetic traffic spikes. Submit team source code and benchmarks.',
      dueDate: getRelativeDueDate(6), // Due in 6 days (Group assignment in DSA201)
      oneDriveLink: 'https://1drv.ms/f/s!Am8-dsa201-hashring-turnin',
      createdBy: 'user-admin-2',
      assignedTo: ['user-student-1', 'user-student-3', 'user-student-4'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'asg-dsa-03',
      courseId: 'course-dsa201',
      submissionType: 'individual',
      title: 'Dynamic Programming Optimization',
      description:
        'Solve multidimensional knapsack and sequence alignment challenges using memoization and bottom-up tabulation. Compare execution time, call stack recursion depth, and space complexity optimizations. Provide comprehensive test suites demonstrating corner cases.',
      dueDate: getRelativeDueDate(12), // Due in 12 days
      oneDriveLink: 'https://1drv.ms/f/s!Am9-dsa201-dp-turnin',
      createdBy: 'user-admin-2',
      assignedTo: ['user-student-1', 'user-student-3', 'user-student-4'],
      createdAt: now,
      updatedAt: now,
    },

    // --- OSY301 (Prof. Arjun Mehta) ---
    {
      id: 'asg-osy-01',
      courseId: 'course-osy301',
      submissionType: 'individual',
      title: 'Multi-threaded Synchronization Engine',
      description:
        'Implement condition variables, mutex locks, and counting semaphores to coordinate concurrent producer-consumer thread pools. Prevent race conditions and priority inversions through structured lock ordering. Validate deadlock-free execution under thread contention stress tests.',
      dueDate: getRelativeDueDate(5), // Due in 5 days
      oneDriveLink: 'https://1drv.ms/f/s!Am10-osy301-threads-turnin',
      createdBy: 'user-admin-2',
      assignedTo: ['user-student-2', 'user-student-3', 'user-student-5'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'asg-osy-02',
      courseId: 'course-osy301',
      submissionType: 'group',
      title: 'Virtual Memory Page Replacement Simulator',
      description:
        'Collaborate to construct an execution simulator comparing FIFO, LRU, Second-Chance, and Clock page replacement algorithms. Track TLB hit ratios, page faults, and physical frame eviction sequences across synthetic memory reference traces. Submit comparative performance graphs and team writeup.',
      dueDate: getRelativeDueDate(15), // Due in 15 days (Group assignment)
      oneDriveLink: 'https://1drv.ms/f/s!Am11-osy301-vm-turnin',
      createdBy: 'user-admin-2',
      assignedTo: ['user-student-2', 'user-student-3', 'user-student-5'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'asg-osy-03',
      courseId: 'course-osy301',
      submissionType: 'group',
      title: 'User-Space File System Implementation',
      description:
        'Implement an indexed hierarchical file system in user space supporting nested directories, inode allocation tables, and block journaling. Guarantee crash resilience through atomic log transactions and verify consistency with an automated fsck utility.',
      dueDate: getRelativeDueDate(20), // Due in 20 days (Group assignment)
      oneDriveLink: 'https://1drv.ms/f/s!Am12-osy301-fs-turnin',
      createdBy: 'user-admin-2',
      assignedTo: ['user-student-2', 'user-student-3', 'user-student-5'],
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Submissions matrix (Individual assignments ONLY)
  // Model rule: Group assignments have NO per-student Submission records.
  const submissions: Submission[] = []

  for (const assignment of assignments) {
    if (assignment.submissionType === 'group') {
      // Group assignments get NO Submission records
      continue
    }

    for (const studentId of assignment.assignedTo) {
      let isSubmitted = false
      let submittedAt: string | null = null

      if (assignment.id === 'asg-web-01') {
        // Overdue (-5d), 100% submitted (5/5)
        isSubmitted = true
        if (studentId === 'user-student-5') {
          // Submitted 6 hours late
          submittedAt = getSubmissionDate(assignment.dueDate, 6)
        } else {
          // Submitted 36 hours before deadline
          submittedAt = getSubmissionDate(assignment.dueDate, -36)
        }
      } else if (assignment.id === 'asg-web-03') {
        // Due soon (+2d), 2 submitted (s2, s4), others pending
        if (['user-student-2', 'user-student-4'].includes(studentId)) {
          isSubmitted = true
          submittedAt = getSubmissionDate(assignment.dueDate, -18)
        }
      } else if (assignment.id === 'asg-hci-01') {
        // Overdue (-3d), 1 submitted (s1), others pending
        if (studentId === 'user-student-1') {
          isSubmitted = true
          submittedAt = getSubmissionDate(assignment.dueDate, -12)
        }
      } else if (assignment.id === 'asg-dsa-01') {
        // Due soon (+3d), 1 submitted (s3), others pending
        if (studentId === 'user-student-3') {
          isSubmitted = true
          submittedAt = getSubmissionDate(assignment.dueDate, -24)
        }
      } else if (assignment.id === 'asg-dsa-03') {
        // Future (+12d), 2 submitted (s1, s4), s3 pending
        if (['user-student-1', 'user-student-4'].includes(studentId)) {
          isSubmitted = true
          submittedAt = new Date(Date.now() - 12 * 3600000).toISOString()
        }
      } else if (assignment.id === 'asg-osy-01') {
        // Future (+5d), 1 submitted (s3), s2 & s5 pending
        if (studentId === 'user-student-3') {
          isSubmitted = true
          submittedAt = new Date(Date.now() - 6 * 3600000).toISOString()
        }
      }

      submissions.push({
        id: `sub-${assignment.id}-${studentId}`,
        assignmentId: assignment.id,
        studentId,
        status: isSubmitted ? 'submitted' : 'not_submitted',
        submittedAt,
      })
    }
  }

  // Group Acknowledgements:
  // - Team Alpha (leader: Aarav Sharma) has acknowledged asg-web-02 on time.
  // - Team Beta has NOT acknowledged asg-web-02.
  // - Other group assignments have no acknowledgements yet.
  const groupAcks: GroupAcknowledgement[] = [
    {
      id: 'gack-web-02-alpha',
      assignmentId: 'asg-web-02',
      groupId: 'grp-web-alpha',
      leaderId: 'user-student-1',
      acknowledgedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ]

  return {
    users: SEED_USERS,
    courses: SEED_COURSES,
    enrollments: SEED_ENROLLMENTS,
    groups: SEED_GROUPS,
    groupAcks,
    assignments,
    submissions,
  }
}
