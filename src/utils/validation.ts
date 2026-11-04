export interface AssignmentFormData {
  title: string
  description: string
  dueDate: string
  driveLink: string
  assignMode: 'all' | 'selected'
  selectedStudentIds: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Validates assignment input fields, mirroring the mock API rules with client-side checks.
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
  const trimmedTitle = data.title.trim()
  if (!trimmedTitle) {
    errors.title = 'Title is required'
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Title must be at least 3 characters'
  } else if (trimmedTitle.length > 80) {
    errors.title = 'Title must not exceed 80 characters'
  }

  // 2. Description validation (required, max 500 characters)
  const trimmedDescription = data.description.trim()
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
      // Future date check on create, or if editing and the due date changed
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

  // 4. Drive link validation (valid http/https URL)
  const trimmedLink = data.driveLink.trim()
  if (!trimmedLink) {
    errors.driveLink = 'Drive link is required'
  } else {
    try {
      const url = new URL(trimmedLink)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.driveLink = 'Drive link must start with http:// or https://'
      }
    } catch {
      errors.driveLink = 'Please enter a valid URL (e.g. https://drive.google.com/...)'
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
