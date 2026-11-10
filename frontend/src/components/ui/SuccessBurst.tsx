import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SuccessBurstProps {
  active: boolean
  onComplete?: () => void
  className?: string
}

export function SuccessBurst({ active, onComplete, className }: SuccessBurstProps) {
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 700)
    return () => clearTimeout(timer)
  }, [active, onComplete])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden select-none motion-reduce:hidden',
        className,
      )}
    >
      {/* Expanding ring */}
      <div className="absolute w-20 h-20 rounded-pill border-2 border-success bg-success-soft/30 animate-burst-ring" />

      {/* Center pop icon */}
      <div className="relative w-12 h-12 rounded-pill bg-success text-success-fg flex items-center justify-center shadow-pop animate-burst-pop">
        <Check className="w-6 h-6 stroke-[3]" />
      </div>
    </div>
  )
}
