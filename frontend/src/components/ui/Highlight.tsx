import { memo } from 'react'

export interface HighlightProps {
  text: string
  query?: string
  className?: string
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const Highlight = memo(function Highlight({
  text,
  query,
  className,
}: HighlightProps) {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>
  }

  const trimmedQuery = query.trim()
  const escaped = escapeRegExp(trimmedQuery)
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-accent-soft text-inherit font-inherit px-0.5 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  )
})
