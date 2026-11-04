/**
 * Extracts a respectful greeting name.
 * If the user's name starts with a title (Prof., Dr., Mr., Ms., Mrs.),
 * returns the title plus the first given name (e.g., "Prof. Meera").
 * Otherwise, returns the first name (e.g., "Aarav").
 */
export function getGreetingName(name?: string): string {
  if (!name) return 'there'

  const trimmed = name.trim()
  const titleRegex = /^(Prof\.|Prof|Dr\.|Dr|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+(\S+)/i
  const match = trimmed.match(titleRegex)

  if (match) {
    return `${match[1]} ${match[2]}`
  }

  const parts = trimmed.split(/\s+/)
  return parts[0] || trimmed
}
