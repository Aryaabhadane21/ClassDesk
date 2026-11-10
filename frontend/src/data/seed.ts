import type { Assignment, Submission, User } from '@/types'

/**
 * Shared demo password for all seeded users.
 * NOTE: Mock authentication only for client-side evaluation; no real authentication backend.
 */
export const DEMO_PASSWORD = 'demo1234'

/**
 * Seed administrative and student accounts
 */
export const SEED_USERS: User[] = [
  // Admins
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
 * Generate fresh seed assignments and submissions.
 * Relative dates are calculated dynamically at the time of seeding.
 */
export function generateSeedData(): {
  users: User[]
  assignments: Assignment[]
  submissions: Submission[]
} {
  const allStudentIds = [
    'user-student-1',
    'user-student-2',
    'user-student-3',
    'user-student-4',
    'user-student-5',
  ]

  const now = new Date().toISOString()

  // 8 assignments: 4 by Prof. Meera Iyer (Web Dev), 4 by Prof. Arjun Mehta (Data Structures)
  const assignments: Assignment[] = [
    // Web Development (Prof. Meera Iyer)
    {
      id: 'asg-web-01',
      title: 'Responsive Portfolio Website',
      description:
        'Develop a multi-page personal portfolio showcasing your modern frontend projects. Ensure semantic HTML5, fluid responsive layouts across mobile and desktop breakpoints, and WCAG AA accessibility standards. Provide complete CSS architecture and lighthouse audit reports.',
      dueDate: getRelativeDueDate(-5), // Overdue by 5 days
      driveLink: 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ012345',
      createdBy: 'user-admin-1',
      assignedTo: [...allStudentIds],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-web-02',
      title: 'Interactive Kanban Task Board',
      description:
        'Implement an interactive task management board with drag-and-drop capabilities. Support creating, moving, and tagging task cards with state management and optimistic UI updates. Persist state in browser storage with full error handling and visual feedback.',
      dueDate: getRelativeDueDate(2), // Due within 2 days
      driveLink: 'https://drive.google.com/drive/folders/2bCdEfGhIjKlMnOpQrStUvWxYz123456',
      createdBy: 'user-admin-1',
      assignedTo: [...allStudentIds],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-web-03',
      title: 'RESTful API Integration & Dashboard',
      description:
        'Connect a React dashboard to a third-party REST API with query parameter filtering, debounced search, and pagination. Handle network latency, loading skeletons, and custom retry logic for transient errors. Include interactive data visualization widgets.',
      dueDate: getRelativeDueDate(7), // Due in 7 days
      driveLink: 'https://drive.google.com/drive/folders/3cDeFgHiJkLmNoPqRsTuVwXyZa234567',
      createdBy: 'user-admin-1',
      assignedTo: [...allStudentIds],
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-web-04',
      title: 'Full-Stack Authentication Flow',
      description:
        'Construct an end-to-end client authentication flow supporting JWT token rotation, role-based route guards, and password recovery. Implement form validation with accessible error messaging and session timeout handling. Document the threat model and CSRF protection.',
      dueDate: getRelativeDueDate(14), // Due in 14 days
      driveLink: 'https://drive.google.com/drive/folders/4dEfGhIjKlMnOpQrStUvWxYzAb345678',
      createdBy: 'user-admin-1',
      // Assigned only to 3 selected students
      assignedTo: ['user-student-1', 'user-student-2', 'user-student-4'],
      createdAt: now,
      updatedAt: now,
    },

    // Data Structures & Algorithms (Prof. Arjun Mehta)
    {
      id: 'asg-dsa-01',
      title: 'Binary Search Tree & AVL Balancing',
      description:
        'Construct self-balancing AVL search trees from scratch in TypeScript with recursive node insertions and deletions. Include in-order, pre-order, and level-order traversal visitors alongside automated height balance recalculations. Measure rotational overhead against standard BSTs.',
      dueDate: getRelativeDueDate(-2), // Overdue by 2 days
      driveLink: 'https://drive.google.com/drive/folders/5eFgHiJkLmNoPqRsTuVwXyZAbc456789',
      createdBy: 'user-admin-2',
      assignedTo: [...allStudentIds],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-dsa-02',
      title: 'Graph Traversal & Shortest Path Algorithms',
      description:
        'Implement Dijkstra and A* pathfinding algorithms on weighted, directed graphs representing transit networks. Analyze computational complexity and vertex exploration patterns with heuristics. Benchmark memory overhead across adjacency matrices versus adjacency lists.',
      dueDate: getRelativeDueDate(1), // Due tomorrow
      driveLink: 'https://drive.google.com/drive/folders/6fGhIjKlMnOpQrStUvWxYzAbcd567890',
      createdBy: 'user-admin-2',
      assignedTo: [...allStudentIds],
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'asg-dsa-03',
      title: 'Dynamic Programming Optimization Challenge',
      description:
        'Solve multidimensional knapsack and sequence alignment challenges using memoization and bottom-up tabulation. Compare execution time, call stack recursion depth, and space complexity optimizations. Provide comprehensive test suites demonstrating corner cases.',
      dueDate: getRelativeDueDate(10), // Due in 10 days
      driveLink: 'https://drive.google.com/drive/folders/7gHiJkLmNoPqRsTuVwXyZAbcde678901',
      createdBy: 'user-admin-2',
      assignedTo: [...allStudentIds],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'asg-dsa-04',
      title: 'LRU Cache & Hash Map Architecture',
      description:
        'Engineer a thread-safe Least Recently Used (LRU) Cache utilizing a doubly-linked list combined with a constant-time hash map. Formulate eviction policies, TTL expiration lifecycles, and amortized O(1) performance guarantees. Include automated stress benchmarks.',
      dueDate: getRelativeDueDate(18), // Due in 18 days
      driveLink: 'https://drive.google.com/drive/folders/8hIjKlMnOpQrStUvWxYzAbcdef789012',
      createdBy: 'user-admin-2',
      // Assigned only to 3 selected students
      assignedTo: ['user-student-3', 'user-student-4', 'user-student-5'],
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Submissions matrix
  // Varied statuses:
  // - asg-web-01 (overdue -5d): 100% submitted (5/5). 4 submitted before due date, 1 submitted 6h late.
  // - asg-web-02 (due soon +2d): 3 submitted (students 1, 2, 4), 2 not submitted.
  // - asg-web-03 (future +7d): 1 submitted early (student 3), 4 not submitted.
  // - asg-web-04 (future +14d, 3 students): 0 submitted (untouched).
  // - asg-dsa-01 (overdue -2d): 2 submitted (students 1, 4 - student 4 submitted 4h late), 3 not submitted.
  // - asg-dsa-02 (due soon +1d): 0 submitted (untouched).
  // - asg-dsa-03 (future +10d): 2 submitted (students 1, 3), 3 not submitted.
  // - asg-dsa-04 (future +18d, 3 students): 1 submitted (student 3), 2 not submitted.

  const submissions: Submission[] = []

  for (const assignment of assignments) {
    for (const studentId of assignment.assignedTo) {
      let isSubmitted = false
      let submittedAt: string | null = null

      if (assignment.id === 'asg-web-01') {
        // Overdue, fully submitted
        isSubmitted = true
        if (studentId === 'user-student-5') {
          // Submitted 6 hours after deadline
          submittedAt = getSubmissionDate(assignment.dueDate, 6)
        } else {
          // Submitted 24-48 hours before deadline
          submittedAt = getSubmissionDate(assignment.dueDate, -36)
        }
      } else if (assignment.id === 'asg-web-02') {
        // Due soon, 3 submitted
        if (['user-student-1', 'user-student-2', 'user-student-4'].includes(studentId)) {
          isSubmitted = true
          submittedAt = getSubmissionDate(assignment.dueDate, -20)
        }
      } else if (assignment.id === 'asg-web-03') {
        // 1 submitted early
        if (studentId === 'user-student-3') {
          isSubmitted = true
          submittedAt = new Date(Date.now() - 12 * 3600000).toISOString()
        }
      } else if (assignment.id === 'asg-web-04') {
        // 0 submitted
        isSubmitted = false
      } else if (assignment.id === 'asg-dsa-01') {
        // Overdue with only a couple submitted
        if (studentId === 'user-student-1') {
          isSubmitted = true
          submittedAt = getSubmissionDate(assignment.dueDate, -12)
        } else if (studentId === 'user-student-4') {
          // Submitted 4 hours late
          isSubmitted = true
          submittedAt = getSubmissionDate(assignment.dueDate, 4)
        }
      } else if (assignment.id === 'asg-dsa-02') {
        // Due tomorrow, untouched
        isSubmitted = false
      } else if (assignment.id === 'asg-dsa-03') {
        // 2 submitted
        if (['user-student-1', 'user-student-3'].includes(studentId)) {
          isSubmitted = true
          submittedAt = new Date(Date.now() - 24 * 3600000).toISOString()
        }
      } else if (assignment.id === 'asg-dsa-04') {
        // 1 submitted
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

  return {
    users: SEED_USERS,
    assignments,
    submissions,
  }
}
