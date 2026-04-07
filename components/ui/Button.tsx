import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'font-mono text-[10px] tracking-[0.25em] uppercase transition-opacity duration-200 disabled:opacity-40 cursor-pointer',
          variant === 'primary' && [
            'bg-gradient-to-br from-[#C8C8C8] to-[#888888]',
            'text-[#060606] px-6 py-3 font-bold',
            'hover:opacity-90',
          ],
          variant === 'ghost' && [
            'border border-[#2A2A2A] text-[#E8E8E8] px-6 py-3',
            'hover:border-[#666666]',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
