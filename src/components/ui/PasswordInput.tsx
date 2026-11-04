import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, type InputProps } from '@/components/ui/Input'

export type PasswordInputProps = Omit<InputProps, 'type' | 'rightIcon'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [showPassword, setShowPassword] = useState(false)

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={toggleVisibility}
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="flex items-center justify-center p-1 rounded-none text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer motion-safe:transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        }
        {...props}
      />
    )
  },
)
