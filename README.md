# ClassDesk

ClassDesk is a responsive Assignment and Review Dashboard designed for educational workflows with two distinct roles: Students and Reviewers/Professors. It is built as a zero-backend, client-side web application where data persistence, asynchronous operations, authentication sessions, and business rules are simulated locally in the browser with production-grade architectural rigor.

**Core Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React, and Vitest with React Testing Library.

---

## 1. Live Demo & Demo Video

- **Live Deployment:** https://classdesk-one.vercel.app/
- **Walkthrough Video:** [`VIDEO_URL_HERE`](https://drive.google.com/file/d/12HDl8yr0V9zxEyMMWEwQTpSwxpfVWZoJ/view?usp=sharing)

---

## 2. Features

### Student Role
- **Progress Indicator:** High-level summary displaying total assignments, completed assignments, pending assignments, and overall completion percentage.
- **Assignment Cards:** Detailed view of each task featuring title, description, instructor name, due date indicators, status badge, and external Google Drive submission links.
- **Two-Step Submission Flow:** Safe confirmation workflow designed to prevent accidental submissions ("Did you submit this on Drive?" footer prompt opens a final confirmation dialog before mutating status to Submitted).
- **Overdue & Due-Soon Highlighting:** Context-aware status badges and border styling alerting students to tasks due within 24–48 hours or past due.
- **Month Calendar View:** Monday-first 42-day month grid with roving keyboard tabindex, visual day chips, and day agenda drawer showing assignments due on any selected date.
- **Notification Center:** Real-time derived notifications alerting students to newly assigned tasks, upcoming deadlines, and overdue assignments, with read state tracking and unread counter badge.

### Admin / Reviewer Role
- **Assignment Management (CRUD):**
  - **Create:** Modal form with title, description, due date, Google Drive resource/turn-in link, and flexible student assignment (assign to all students or specific subset).
  - **Read:** Card overview showing assignment details, due date status, and class completion rate.
  - **Update:** Edit existing assignment details in place without page reloads.
  - **Delete:** Removal workflow protected by an accessible confirmation dialog.
- **Per-Student Submission Roster:** Expandable review panel for every assignment displaying each student's name, email, submission status, and timestamp (distinguishing on-time vs. late submissions).
- **Class Completion Progress:** Visual progress bar and percentage tracking overall class turn-in rate.
- **Month Calendar View:** Monthly distribution of assignment deadlines across the course.
- **Notification Center:** Alerts for new student submissions and class completion milestones.

### General & Platform Features
- **Search, Filters & Sorting:** URL-backed search query, status filter (all / pending / submitted / complete), due date filter (all / overdue / today / next 7 days / later), and sort criteria (due date, title, creation date).
- **Theme Support:** Dark and light modes with manual toggle, automatic system color-scheme detection, and persistent storage in localStorage.
- **Responsive Layout Shell:** Collapsible desktop sidebar and mobile navigation drawer with backdrop blur and touch targets sized to 44px or greater.
- **Resilient Error States:** Global top-level React Error Boundary and toggleable network error simulation via `?simulateErrors=true` query parameter to test resilience.
- **Motion-Safe Transitions:** Subtle CSS keyframe animations automatically disabled when `prefers-reduced-motion: reduce` is enabled in OS settings.
- **Full Keyboard & Screen Reader Accessibility:** Semantic HTML landmarks, ARIA live regions, focus trapping in dialogs, and WCAG 2.1 AA color contrast compliance.

---

## 3. Demo Accounts

All demo accounts share the default password: `demo1234`. The database is seeded automatically upon first launch.

| Name | Email | Role | Description |
| :--- | :--- | :--- | :--- |
| **Prof. Meera Iyer** | `meera.iyer@classdesk.edu` | Admin / Reviewer | Primary instructor; created course assignments |
| **Prof. Arjun Mehta** | `arjun.mehta@classdesk.edu` | Admin / Reviewer | Co-instructor; reviews project milestones |
| **Aarav Sharma** | `aarav.sharma@classdesk.edu` | Student | Active student; has both completed and pending tasks |
| **Diya Patel** | `diya.patel@classdesk.edu` | Student | Has submissions completed and in-review |
| **Rohan Gupta** | `rohan.gupta@classdesk.edu` | Student | Has overdue assignments to demonstrate alert styling |
| **Ishita Sen** | `ishita.sen@classdesk.edu` | Student | Mixed submission state across course modules |
| **Kabir Verma** | `kabir.verma@classdesk.edu` | Student | Active student enrolled in all course modules |

> **Note on Data Reset:** Data is stored in browser `localStorage`. You can restore the pristine seed state at any time using the **Reset demo data** button located under the "Demo accounts" section on the Login page.

---

## 4. Tech Stack & Architectural Decisions

| Library / Tool | Version | Justification |
| :--- | :--- | :--- |
| **React** | 19.x | Latest stable foundation leveraging modern component patterns, hooks, and clean state primitives. |
| **TypeScript** | 5.8+ | Strict type checking throughout models, mock API contracts, date helpers, and UI props to prevent runtime regressions. |
| **Tailwind CSS** | 4.x | Utility-first styling with modern CSS variables, zero-runtime overhead, and cohesive design tokens for light/dark themes. |
| **React Router** | 7.x | Robust client-side routing, URL search parameter synchronization for filters, and role-based route guards. |
| **Lucide React** | Latest | Lightweight, accessible, and consistent SVG icon set. |
| **Vitest & RTL** | 3.x / 16.x | Fast, modern testing harness for pure domain logic and component integration flows with `@testing-library/react`. |

### Why No Heavy State Management Library (Redux / Zustand)?
For this application, client state is naturally divided between server-like persisted data (managed cleanly by the mock API and data hooks with in-place cache updates) and transient UI state (filters in URL search params, modal visibility in component state). Introducing Redux or Zustand would add unnecessary boilerplate without improving maintainability.

---

## 5. Getting Started

### Prerequisites
- Node.js 18.0.0 or higher (Node 20+ recommended)
- npm 9.0.0 or higher

### Installation & Development
```bash
# 1. Clone repository
cd ClassDesk

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open your browser at `http://localhost:5173`.

### Running Automated Tests
```bash
# Run test suite once
npm run test:run

# Run test suite in watch mode
npm test
```

### Production Build & Preview
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Testing Error States
To test the application's error handling and retry mechanisms, append `?simulateErrors=true` to any URL in your browser:
```
http://localhost:5173/student?simulateErrors=true
```
When enabled, the mock API will intermittently reject API requests with random simulated network failures, triggering the UI's error states and retry buttons.

---

## 6. Folder Structure

```
src/
├── app/                  # Application bootstrap, routing, route guards, error boundary
│   ├── AppProviders.tsx  # Top-level context providers (Theme, Auth, Toast)
│   ├── ErrorBoundary.tsx # Top-level React error boundary with fallback view
│   ├── guards.tsx        # Role-based route guard components (StudentGuard, AdminGuard)
│   └── router.tsx        # Client-side route declarations and layout wrapping
├── components/           # Reusable UI component library
│   ├── assignments/      # Assignment cards, form modals, roster tables, progress bars
│   ├── calendar/         # Month calendar, day agenda drawer, calendar navigation
│   ├── layout/           # App shell, top bar, sidebar, mobile drawer, notification bell
│   └── ui/               # Core design system primitives (Button, Input, Modal, Badge, etc.)
├── context/              # Global React contexts
│   ├── AuthContext.tsx   # User session, login, logout, mock token state
│   └── ThemeContext.tsx  # Light/dark mode state and DOM class synchronization
├── data/                 # Initial mock data and seeds
│   └── seed.ts           # Deterministic generator for professors, students, assignments, submissions
├── features/             # Feature-specific page components
│   ├── admin/            # Admin assignments management and calendar views
│   ├── auth/             # Login page and authentication forms
│   ├── dev/              # Component design system gallery (DEV mode only)
│   └── student/          # Student dashboard and personal calendar views
├── services/             # Mock backend and persistence layer
│   ├── mockApi.ts        # Simulated REST client with latency, validation, and error flags
│   └── storage.ts        # Safe localStorage JSON wrapper with fallback memory cache
├── styles/               # Styling configuration
│   ├── animations.css    # Keyframe animations with prefers-reduced-motion protection
│   ├── index.css         # Tailwind entry point and base layer
│   └── tokens.css        # CSS custom properties for light and dark color themes
├── tests/                # Automated tests
│   ├── integration/      # End-to-end integration tests for critical workflows
│   ├── renderWithProviders.tsx # Test wrapper configuring Router, Auth, and Theme
│   ├── setup.ts          # Vitest environment setup and Jest-DOM matchers
│   └── unit/             # Unit tests for pure logic (dates, filters, selectors, calendar)
├── types/                # TypeScript interface definitions
│   └── index.ts          # Core domain models (User, Assignment, Submission, API types)
└── utils/                # Pure helper functions
    ├── calendar.ts       # Monday-first month grid math and date grouping
    ├── cn.ts             # Tailwind class merging utility (clsx + twMerge)
    ├── dates.ts          # Date formatting and overdue/due-soon calculation
    ├── dueStyles.ts      # Semantic styling tokens based on due status
    ├── filters.ts        # Case-insensitive filtering, status matching, sorting
    ├── names.ts          # Honorific and first-name greeting extraction
    ├── notifications.ts  # Derived notification generation and sorting
    ├── routes.ts         # Navigation route constants and role path resolvers
    └── selectors.ts      # Assignment completion ratios and submission sorting
```

---

## 7. Component Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Browser LocalStorage                 │
│   (classdesk:users, assignments, submissions, etc.)    │
└───────────────────────────┬────────────────────────────┘
                            │ Read / Write JSON
┌───────────────────────────▼────────────────────────────┐
│                    Mock API Service                    │
│   - Configurable latency (150ms - 300ms)               │
│   - Network error simulation (?simulateErrors=true)    │
│   - Validation & relational constraints                │
└───────────────────────────┬────────────────────────────┘
                            │ Async Promises
┌───────────────────────────▼────────────────────────────┐
│               Custom Feature Data Hooks                │
│   - useStudentAssignments (status, items, markDone)    │
│   - useAdminAssignments (status, items, CRUD handlers) │
│   - useAssignmentFilters (URL search param sync)       │
└───────────────────────────┬────────────────────────────┘
                            │ Reactive State
┌───────────────────────────▼────────────────────────────┐
│                  Presentation Layer                    │
│   - StudentDashboardPage / AdminAssignmentsPage        │
│   - StudentAssignmentCard / AdminAssignmentCard        │
│   - SubmitConfirmation / AssignmentFormModal           │
└────────────────────────────────────────────────────────┘
```

### In-Place State Updates
When a student confirms a submission or an administrator creates, edits, or deletes an assignment, the UI does not trigger an expensive full-page refetch. Instead, the mutation function writes to storage via `mockApi` and updates the React hook state in place. This guarantees instantaneous UI updates, zero scroll jump, and an optimistic, app-like feel.

---

## 8. Data Model & Relationships

The application domain is modeled strictly in TypeScript:

- **`User`**: `id`, `name`, `email`, `role ('student' | 'admin')`, `avatarUrl?`
- **`Assignment`**: `id`, `title`, `description`, `dueDate` (ISO 8601), `driveUrl`, `assignedTo` (`'all' | string[]`), `createdBy` (admin user ID), `createdAt`, `updatedAt`
- **`Submission`**: `id`, `assignmentId`, `studentId`, `submittedAt` (ISO 8601), `status ('submitted' | 'graded')`, `notes?`

### Storage Keys
Data is isolated in `localStorage` under distinct keys:
- `classdesk:users`: Stored user profiles.
- `classdesk:assignments`: All course assignments.
- `classdesk:submissions`: Recorded student submissions.
- `classdesk:notification-reads`: Read notification tracking per user.
- `classdesk:session`: Active user session identifier.
- `classdesk:theme`: Active color theme (`'light'` or `'dark'`).

---

## 9. Key Design Decisions

1. **Zero-Backend Architecture:** To fulfill the assignment requirements while reflecting real-world engineering conditions, network latency is deliberately introduced (150ms–300ms) on mock API calls. Mutations validate inputs, enforce referential integrity, and persist to `localStorage`.
2. **URL as Single Source of Truth for Filters:** Search queries, status tabs, due date filters, and sort orders are reflected directly in the URL search parameters (`?q=...&status=...&due=...&sort=...`). This makes user filter views bookmarkable, refreshable, and shareable.
3. **Two-Step Submission Flow:** To prevent accidental student turn-ins, the submission interaction is staged: clicking "Yes, I have submitted" reveals a focused confirmation dialog emphasizing that work must already be uploaded to Google Drive before marking it complete.
4. **Accessible Dialogs & Focus Trapping:** All modal windows and confirmation dialogs employ focus trapping, manage initial focus onto primary or cancel buttons, lock body scroll, and dismiss reliably via the `Escape` key.
5. **Motion-Safe Styling:** All animations and transitions are wrapped inside `@media (prefers-reduced-motion: no-preference)`. When users enable "Reduce Motion" in their operating system, animations are automatically stripped to 0s duration to prevent motion sickness.

---

## 10. Automated Testing

The test suite contains **63 tests across 13 test suites** with 100% passing results:

```bash
npm run test:run
```

### Coverage Breakdown
- **Unit Tests:**
  - `dates.test.ts`: Due date formatting, overdue detection, relative date boundaries.
  - `calendar.test.ts`: Month grid generation, leap years, Monday-first week calculations.
  - `filters.test.ts`: Text search, status filtering, due date windows, stable multi-field sorting.
  - `selectors.test.ts`: Completion ratios, percentage rounding, submission roster sorting.
  - `notifications.test.ts`: Derived notification calculation for both student and admin roles.
  - `mockApi.test.ts`: Full CRUD operations, error simulation, authentication checks.
  - `dropdown.test.tsx`: WAI-ARIA listbox pattern, trigger toggling, keyboard navigation, selection.
  - `highlight.test.tsx`: Safe text highlight escaping and matched snippet wrapping.
- **Integration Tests:**
  - `login.test.tsx`: Form validation, invalid credentials banner, demo account auto-fill, reset demo data flow.
  - `studentSubmission.test.tsx`: Two-step submission confirmation flow and in-place progress update.
  - `adminCreate.test.tsx`: Assignment creation modal, required field validation, and roster list injection.
  - `routeGuard.test.tsx`: Role-based route protection, unauthorized redirects, and session restoration.
  - `assignmentToolbar.test.tsx`: Search input, filter chips, keyboard shortcut, clear filters.

---

## 11. Accessibility (a11y)

ClassDesk was developed to meet **WCAG 2.1 Level AA** standards:
- **Color Contrast:** All body text meets at least 4.5:1 contrast against light and dark background surfaces; secondary badges and muted text maintain a minimum of 3:1 for large text and 4.5:1 for standard text.
- **Semantic Structure:** Every view defines one `<h1>` heading followed by a logical hierarchy of `<h2>` and `<h3>` elements; landmark elements (`<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`) are used throughout.
- **Keyboard Usability:** The calendar grid supports arrow key and Tab navigation; dropdowns, menus, and modals support `Escape` to close; all interactive buttons have visible `:focus-visible` outline rings.
- **Screen Reader Support:** External links include `(opens in a new tab)` announcements; icon buttons define explicit `aria-label`s; toast notifications announce via `aria-live="polite"`.

---

## 12. Deployment

ClassDesk is configured for zero-configuration Single Page Application (SPA) deployment on **Vercel**.

The repository includes `vercel.json` to handle client-side routing rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

To deploy your own copy:
1. Push this repository to GitHub or GitLab.
2. Import the repository into the [Vercel Dashboard](https://vercel.com).
3. Set Framework Preset to **Vite**.
4. Deploy.

---

## 13. Limitations & Future Work

While ClassDesk provides a complete, polished experience, the following enhancements represent natural next steps for a full production deployment:
- **Multi-Client Synchronization:** Because persistence is isolated to local browser storage, changes do not synchronize across different devices or browsers in real time. Introducing a WebSocket or Server-Sent Events (SSE) backend would enable live collaborative updates.
- **Production Authentication:** Current authentication is simulated via local storage tokens. A production backend would implement secure, HTTP-only cookie-based sessions with JWT or OAuth2/SAML institutional single sign-on (SSO).
- **Direct File Storage:** Students currently submit work by providing links to Google Drive documents. Future work could introduce direct file drag-and-drop to Amazon S3 or Google Cloud Storage buckets with preview rendering.
- **Grading & Rubrics:** Extending the reviewer role to include grade assignment, rubric evaluation, and written student feedback directly in the submission roster.
