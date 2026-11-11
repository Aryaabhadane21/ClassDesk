import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useToast } from '@/components/ui'
import { cn } from '@/utils/cn'

export interface JoinCodeChipProps {
  code: string
  courseName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function JoinCodeChip({
  code,
  courseName,
  size = 'md',
  className,
}: JoinCodeChipProps) {
  const { success, error } = useToast()
  const [copied, setCopied] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        textarea.style.top = '-999999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        try {
          document.execCommand('copy')
        } finally {
          document.body.removeChild(textarea)
        }
      }

      setCopied(true)
      const msg = `Join code ${code} copied to clipboard`
      setLiveMessage(msg)
      success('Join code copied')

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopied(false)
        setLiveMessage('')
      }, 2000)
    } catch {
      error('Failed to copy join code')
    }
  }

  const ariaLabel = courseName
    ? `Copy join code for ${courseName}`
    : `Copy join code ${code}`

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-base font-medium px-4 py-2 gap-3',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md bg-surface-2 border border-line select-none',
        sizeClasses[size],
        className,
      )}
    >
      <span className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </span>
      <span className="font-mono tabular-nums font-semibold tracking-wider text-fg">
        {code}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          void copyToClipboard()
        }}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          'p-1 rounded-sm text-muted hover:text-fg hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer motion-safe:transition-colors shrink-0',
          copied && 'text-success hover:text-success',
        )}
      >
        {copied ? (
          <Check className={iconSizes[size]} aria-hidden="true" />
        ) : (
          <Copy className={iconSizes[size]} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
