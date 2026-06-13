import { cn } from '@/lib/utils'

interface FixedBottomBarProps {
  left?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Fixed action bar at the bottom of form pages. Use inside FormLayout's bottomBar prop. */
export function FixedBottomBar({ left, children, className }: FixedBottomBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 h-[60px]',
        'bg-white border-t border-[#d9e2e5]',
        'flex items-center justify-between px-4 lg:px-6',
        className,
      )}
    >
      {/* Left: document info / status summary */}
      <div className="flex items-center gap-3 text-[13px] text-[#64748b]">
        {left}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
