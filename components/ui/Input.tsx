import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-[#0D0D0D] border border-[#2A2A2A] text-[#E8E8E8]',
        'font-mono text-xs tracking-widest uppercase placeholder:text-[#333333]',
        'px-4 py-3 outline-none focus:border-[#666666] transition-colors duration-200',
        className,
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export default Input
