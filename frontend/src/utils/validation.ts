import type { LoginInput, RegisterInput } from '@/types'

export type LoginErrors = Partial<Record<keyof LoginInput, string>>
export type RegisterErrors = Partial<Record<keyof RegisterInput, string>>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates whether a string matches a standard email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false
  return EMAIL_REGEX.test(email.trim())
}

/**
 * Pure validation for login credentials.
 * Returns an object containing error messages for invalid fields.
 */
export function validateLogin(input: Partial<LoginInput>): LoginErrors {
  const errors: LoginErrors = {}

  const trimmedEmail = input.email ? input.email.trim() : ''
  if (!trimmedEmail) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Enter a valid email address'
  }

  if (!input.password) {
    errors.password = 'Password is required'
  }

  return errors
}

/**
 * Pure validation for registration credentials.
 * Returns an object containing error messages for invalid fields.
 */
export function validateRegister(input: Partial<RegisterInput>): RegisterErrors {
  const errors: RegisterErrors = {}

  // Name: trimmed 2-60 characters
  const trimmedName = input.name ? input.name.trim() : ''
  if (!trimmedName) {
    errors.name = 'Name is required'
  } else if (trimmedName.length < 2 || trimmedName.length > 60) {
    errors.name = 'Name must be between 2 and 60 characters'
  }

  // Email: valid format, at most 120 characters
  const trimmedEmail = input.email ? input.email.trim() : ''
  if (!trimmedEmail) {
    errors.email = 'Email is required'
  } else if (trimmedEmail.length > 120) {
    errors.email = 'Email must not exceed 120 characters'
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Enter a valid email address'
  }

  // Password: 8-64 characters with at least one letter and one number
  const password = input.password ?? ''
  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else if (password.length > 64) {
    errors.password = 'Password must not exceed 64 characters'
  } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password needs at least one letter and one number'
  }

  // Confirm password (only evaluated when provided)
  if (input.confirmPassword !== undefined && input.confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  // Role: must be 'student' or 'admin'
  if (input.role !== 'student' && input.role !== 'admin') {
    errors.role = 'Choose a role'
  }

  return errors
}

/**
 * Helper to determine if an errors map contains any field errors.
 */
export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((err) => Boolean(err && err.trim().length > 0))
}

// ---------------------------------------------------------------------------
// Assignment Form Validation (used by Admin assignment modal)
// ---------------------------------------------------------------------------

export interface AssignmentFormData {
  title: string
  description: string
  dueDate: string
  oneDriveLink: string
  assignMode: 'all' | 'selected'
  selectedStudentIds: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Validates assignment input fields for the admin modal.
 */
export function validateAssignmentForm(
  data: AssignmentFormData,
  options: {
    isEditing?: boolean
    originalDueDate?: string
  } = {},
): ValidationResult {
  const errors: Record<string, string> = {}

  // 1. Title validation (3-80 characters)
  const trimmedTitle = (data.title || '').trim()
  if (!trimmedTitle) {
    errors.title = 'Title is required'
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Title must be at least 3 characters'
  } else if (trimmedTitle.length > 80) {
    errors.title = 'Title must not exceed 80 characters'
  }

  // 2. Description validation (required, max 500 characters)
  const trimmedDescription = (data.description || '').trim()
  if (!trimmedDescription) {
    errors.description = 'Description is required'
  } else if (trimmedDescription.length > 500) {
    errors.description = 'Description must not exceed 500 characters'
  }

  // 3. Due date validation
  if (!data.dueDate) {
    errors.dueDate = 'Due date and time are required'
  } else {
    const dueTime = new Date(data.dueDate).getTime()
    if (isNaN(dueTime)) {
      errors.dueDate = 'Please enter a valid date and time'
    } else {
      const isDueDateChanged =
        options.isEditing && options.originalDueDate
          ? new Date(options.originalDueDate).getTime() !== dueTime
          : false

      if (!options.isEditing || isDueDateChanged) {
        if (dueTime <= Date.now()) {
          errors.dueDate = 'Due date must be in the future'
        }
      }
    }
  }

  // 4. OneDrive link validation (valid http/https URL)
  const trimmedLink = (data.oneDriveLink || '').trim()
  if (!trimmedLink) {
    errors.oneDriveLink = 'OneDrive link is required'
  } else {
    try {
      const url = new URL(trimmedLink)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.oneDriveLink = 'OneDrive link must start with http:// or https://'
      }
    } catch {
      errors.oneDriveLink = 'Please enter a valid URL (e.g. https://onedrive.live.com/...)'
    }
  }

  // 5. Assigned students validation
  if (data.assignMode === 'selected') {
    if (!data.selectedStudentIds || data.selectedStudentIds.length === 0) {
      errors.assignedTo = 'Select at least one student for this assignment'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
