import { useState } from 'react'
import {
  Bell,
  Calendar,
  FileText,
  Mail,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  GradientBlob,
  IconButton,
  Input,
  Modal,
  PasswordInput,
  ProgressBar,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Spinner,
  Textarea,
  ThemeToggle,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { DEMO_PASSWORD } from '@/data/seed'

// temporary, replaced in a later step
export default function App() {
  const { user, status, login, logout } = useAuth()
  const { success, error, info } = useToast()

  // Gallery interactive states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkboxVal, setCheckboxVal] = useState(true)
  const [progressVal, setProgressVal] = useState(65)

  const handleDemoLogin = async (email: string) => {
    try {
      setLoginError(null)
      setIsSubmitting(true)
      await login(email, DEMO_PASSWORD)
      success(`Signed in successfully as ${email.split('@')[0]}`, 'Authentication')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setLoginError(msg)
      error(msg, 'Authentication Error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmAction = async () => {
    setConfirmLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setConfirmLoading(false)
    setIsConfirmOpen(false)
    success('Assignment deleted successfully', 'Deleted')
  }

  return (
    <div className="min-h-screen bg-app text-fg p-4 sm:p-8 lg:p-12 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" role="img" aria-label="Book logo">
                📚
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
                ClassDesk UI Library
              </h1>
            </div>
            <p className="font-body text-sm text-muted mt-1">
              Step 5 component gallery &amp; theme token verification (light/dark responsive).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">
              Theme:
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* 1. BUTTONS & ICON BUTTONS */}
        <section className="space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold text-fg tracking-tight">
              1. Buttons &amp; IconButtons
            </h2>
            <p className="text-xs text-muted">Variants, sizes, loading &amp; icon states.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Pill</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Small with Icon
            </Button>
            <Button variant="primary" size="md" rightIcon={<Sparkles className="w-4 h-4" />}>
              Medium with Icon
            </Button>
            <Button variant="accent" size="lg" leftIcon={<Calendar className="w-5 h-5" />}>
              Large Button
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-muted font-medium">IconButtons:</span>
            <IconButton variant="primary" aria-label="Add new item">
              <Plus className="w-4 h-4" />
            </IconButton>
            <IconButton variant="secondary" aria-label="View notifications">
              <Bell className="w-4 h-4" />
            </IconButton>
            <IconButton variant="accent" aria-label="User profile">
              <UserIcon className="w-4 h-4" />
            </IconButton>
            <IconButton variant="danger" aria-label="Delete item">
              <Trash2 className="w-4 h-4" />
            </IconButton>
            <IconButton variant="ghost" aria-label="Search records">
              <Search className="w-4 h-4" />
            </IconButton>
          </div>
        </section>

        {/* 2. FORM CONTROLS */}
        <section className="space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold text-fg tracking-tight">
              2. Form Controls
            </h2>
            <p className="text-xs text-muted">
              Pill inputs, password show/hide, textareas, selects, and accessible checkboxes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Student Name"
              placeholder="e.g. Aarav Sharma"
              hint="Enter your full registered name"
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Email Address (With Error)"
              placeholder="you@classdesk.edu"
              defaultValue="invalid-email"
              error="Please enter a valid institutional email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <PasswordInput
              label="Password Input"
              placeholder="Enter your password"
              hint="Supports accessible show/hide toggle"
              defaultValue="demo1234"
            />

            <Select
              label="Course Selection"
              hint="Choose active course track"
              options={[
                { label: 'Web Development (CS301)', value: 'cs301' },
                { label: 'Data Structures & Algorithms (CS201)', value: 'cs201' },
                { label: 'Database Systems (CS401)', value: 'cs401', disabled: true },
              ]}
            />
          </div>

          <Textarea
            label="Assignment Description"
            placeholder="Type comprehensive project instructions here..."
            hint="Maximum 500 characters"
            rows={3}
          />

          <div className="flex flex-col sm:flex-row gap-6 pt-2">
            <Checkbox
              label="Send email notification to enrolled students"
              description="Notifies students 48 hours before the due date deadline."
              checked={checkboxVal}
              onChange={(e) => setCheckboxVal(e.target.checked)}
            />
            <Checkbox
              label="Enforce strict deadline cutoff"
              description="Disallows late submissions after 23:59 on the due date."
              defaultChecked={false}
            />
          </div>
        </section>

        {/* 3. BADGES & PROGRESS BARS */}
        <section className="space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold text-fg tracking-tight">
              3. Badges &amp; Progress
            </h2>
            <p className="text-xs text-muted">Status tags and animated progress bars.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="neutral" dot>
              Neutral Badge
            </Badge>
            <Badge tone="accent" dot>
              Accent Active
            </Badge>
            <Badge tone="success" dot>
              Submitted
            </Badge>
            <Badge tone="warning" dot>
              Due Soon
            </Badge>
            <Badge tone="danger" dot>
              Overdue
            </Badge>
            <Badge tone="info" icon={<FileText className="w-3 h-3" />}>
              5 Submissions
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <ProgressBar
              value={progressVal}
              max={100}
              label="Classroom Submissions Progress"
              showCount
              tone="accent"
            />
            <ProgressBar
              value={5}
              max={5}
              label="All Students Completed (100%)"
              showCount
              tone="success"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setProgressVal((p) => Math.min(100, p + 15))}
            >
              Increase Progress
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setProgressVal((p) => Math.max(0, p - 15))}
            >
              Reset / Decrease
            </Button>
          </div>
        </section>

        {/* 4. CARDS & AVATARS */}
        <section className="space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold text-fg tracking-tight">
              4. Cards &amp; Avatars
            </h2>
            <p className="text-xs text-muted">
              Static and interactive cards with deterministic token-tinted avatars.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-muted font-medium">Avatars:</span>
            <Avatar name="Prof. Meera Iyer" size="lg" />
            <Avatar name="Prof. Arjun Mehta" size="md" />
            <Avatar name="Aarav Sharma" size="md" />
            <Avatar name="Diya Patel" size="sm" />
            <Avatar name="Kabir Singh" size="sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Standard Card
                </span>
                <Badge tone="info">Informational</Badge>
              </div>
              <h3 className="font-display text-lg font-semibold text-fg">
                Static Assignment Overview
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                A clean card container utilizing border-line, radius-lg, and shadow-card tokens.
              </p>
            </Card>

            <Card
              interactive
              onClick={() => info('Interactive card clicked!', 'Interaction')}
              className="p-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Interactive Card (Hover Lift)
                </span>
                <Badge tone="accent">Click Me</Badge>
              </div>
              <h3 className="font-display text-lg font-semibold text-fg">
                Interactive Card with Hover Lift
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Applies subtle translation lift and elevated shadow token on hover for cards.
              </p>
            </Card>
          </div>
        </section>

        {/* 5. GRADIENT BLOB COVERS */}
        <section className="space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold text-fg tracking-tight">
              5. GradientBlob Covers (Row of 4 Seeds)
            </h2>
            <p className="text-xs text-muted">
              CSS-only blurred decorative shapes with deterministic arrangements from seeds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { seed: 'asg-web-01-portfolio', title: 'Portfolio Website' },
              { seed: 'asg-web-02-kanban', title: 'Kanban Board' },
              { seed: 'asg-dsa-01-bst', title: 'AVL Balancing' },
              { seed: 'asg-dsa-02-graphs', title: 'Graph Dijkstra' },
            ].map((item) => (
              <Card key={item.seed} className="overflow-hidden">
                <GradientBlob seed={item.seed} variant="cover" />
                <div className="p-4 space-y-1">
                  <h4 className="font-display text-sm font-semibold text-fg">{item.title}</h4>
                  <p className="text-[11px] text-muted truncate">Seed: {item.seed}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 6. MODALS, TOASTS & STATES */}
        <section className="space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold text-fg tracking-tight">
              6. Modals, Toasts &amp; Feedback States
            </h2>
            <p className="text-xs text-muted">
              Accessible dialogs with focus trapping, toast notifications, skeletons, and empty/error states.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Open Accessible Modal
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsConfirmOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Open Danger ConfirmDialog
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs text-muted font-medium">Toasts:</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                success('Assignment marked as submitted successfully.', 'Submission Received')
              }
            >
              Trigger Success Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                error('Network connection timed out. Please retry.', 'Network Error')
              }
            >
              Trigger Error Toast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                info('A new assignment was posted in Web Development.', 'New Notification')
              }
            >
              Trigger Info Toast
            </Button>
          </div>

          {/* Skeletons Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3 p-5 rounded-lg border border-line bg-surface">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Skeleton Blocks &amp; Text
              </span>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10" rounded="pill" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/3" rounded="sm" />
                  <Skeleton className="h-3 w-1/2" rounded="sm" />
                </div>
              </div>
              <SkeletonText lines={3} />
            </div>

            <SkeletonCard />
          </div>

          {/* Empty & Error States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <EmptyState
              title="No Pending Assignments"
              description="You have completed all current course deliverables. Check back later for new modules."
              action={
                <Button variant="secondary" size="sm">
                  View Archive
                </Button>
              }
            />

            <ErrorState
              title="Failed to Load Roster"
              message="The student roster could not be retrieved due to a temporary storage interruption."
              onRetry={() => info('Retrying fetch operation...', 'Retry')}
            />
          </div>
        </section>

        {/* 7. SESSION TEST SECTION (Preserved from Step 4) */}
        <section className="space-y-4 pt-4 border-t border-line">
          <div className="border-b border-line pb-2">
            <h2 className="font-display text-xl font-semibold text-fg tracking-tight">
              7. Session Test (Auth Context)
            </h2>
            <p className="text-xs text-muted">
              Live session persistence with role switching and token status.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-surface border border-line shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                Active Session
              </span>
              <span className="text-xs px-2.5 py-1 rounded-pill bg-surface-2 text-fg border border-line">
                Status: <strong className="capitalize">{status}</strong>
              </span>
            </div>

            {status === 'loading' ? (
              <div className="flex items-center gap-2 py-2">
                <Spinner size="sm" tone="accent" />
                <p className="text-sm text-muted">Restoring session...</p>
              </div>
            ) : status === 'authenticated' && user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-md bg-surface-2 border border-line">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} size="md" />
                  <div>
                    <div className="text-sm font-semibold text-fg">{user.name}</div>
                    <div className="text-xs text-muted">{user.email}</div>
                    <div className="text-xs text-accent font-semibold mt-0.5 uppercase tracking-wider">
                      Role: {user.role}
                    </div>
                  </div>
                </div>

                <Button variant="danger" size="sm" onClick={logout}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Not signed in. Click a demo account to test auth context &amp; session persistence:
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('meera.iyer@classdesk.edu')}
                  >
                    Sign in as Prof. Meera Iyer (admin)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleDemoLogin('aarav.sharma@classdesk.edu')}
                  >
                    Sign in as Aarav Sharma (student)
                  </Button>
                </div>
                {loginError && <p className="text-xs text-danger font-medium">{loginError}</p>}
              </div>
            )}
          </div>
        </section>

        {/* Modal Instance */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Accessible Modal Dialog"
          description="Keyboard-accessible with Tab focus trapping and Escape key support."
        >
          <div className="space-y-4">
            <p className="text-sm text-muted leading-relaxed">
              This modal dialog is rendered through a portal to document body, traps focus
              automatically inside, locks the background scroll, and returns focus to the trigger
              button when closed.
            </p>
            <Input label="Demo Field Inside Modal" placeholder="Try tabbing through fields" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsModalOpen(false)
                  success('Modal action submitted successfully', 'Success')
                }}
              >
                Submit Action
              </Button>
            </div>
          </div>
        </Modal>

        {/* ConfirmDialog Instance */}
        <ConfirmDialog
          isOpen={isConfirmOpen}
          tone="danger"
          title="Delete Assignment?"
          message="Are you sure you want to delete this assignment? All associated student submissions and records will be permanently removed. This action cannot be undone."
          confirmLabel="Delete Assignment"
          cancelLabel="Keep Assignment"
          loading={confirmLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setIsConfirmOpen(false)}
        />
      </div>
    </div>
  )
}
