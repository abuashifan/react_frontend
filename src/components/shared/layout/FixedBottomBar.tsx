import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface FixedBottomBarProps {
  left?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Fixed action bar at the bottom of form pages. Use inside FormLayout's bottomBar prop.
 * Reports its own rendered height via `--shell-bottom-bar-actual-h` so FormLayout can
 * reserve exactly enough scroll padding even when buttons wrap onto a second line on
 * narrow/short screens, instead of assuming a fixed single-row height.
 */
export function FixedBottomBar({ left, children, className }: FixedBottomBarProps) {
  const barRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = barRef.current
    if (!el) return

    const updateHeight = () => {
      document.documentElement.style.setProperty('--shell-bottom-bar-actual-h', `${el.offsetHeight}px`)
    }
    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--shell-bottom-bar-actual-h')
    }
  }, [])

  return (
    <div
      ref={barRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 min-h-[calc(56px+var(--shell-safe-bottom))]',
        'bg-white border-t border-[#d9e2e5]',
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 pb-[calc(var(--shell-safe-bottom)+0.625rem)] lg:px-6',
        className,
      )}
    >
      {/* Left: document info / status summary */}
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#64748b]">
        {left}
      </div>

      {/* Right: action buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  )
}
