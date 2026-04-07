import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  active?: boolean
}

export default function Badge({ children, className, active }: BadgeProps) {
  return (
    <span
      className={cn(
        'font-mono text-[9px] tracking-[0.25em] uppercase px-2 py-1',
        'bg-[#1A1A1A] border border-[#2A2A2A] text-[#666666]',
        active && 'border-[#E8E8E8] text-[#E8E8E8]',
        className,
      )}
    >
      {children}
    </span>
  )
}
