import { useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── FilterSection ───────────────────────────────────────────────────────────

interface FilterSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-[#f1f5f9] last:border-0">
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-3 text-[12px] font-semibold text-[#24323a] hover:bg-[#f8fafc] transition-colors"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-[#64748b] transition-transform duration-150',
            !isOpen && '-rotate-90',
          )}
        />
      </button>

      <div className={cn('px-4 pb-3 flex flex-col gap-2.5', !isOpen && 'hidden')}>
        {children}
      </div>
    </div>
  )
}

// ─── FilterSidebar ───────────────────────────────────────────────────────────

interface FilterSidebarProps {
  children: React.ReactNode
  activeCount?: number
  onReset?: () => void
}

export function FilterSidebar({ children, activeCount = 0, onReset }: FilterSidebarProps) {
  return (
    <aside className="w-[220px] shrink-0 border-r border-[#d9e2e5] bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#d9e2e5]">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[#24323a]">Filter</span>
          {activeCount > 0 && (
            <Badge
              className="h-4 px-1.5 text-[10px] font-bold bg-[#e39774] text-white hover:bg-[#e39774] rounded-full"
            >
              {activeCount}
            </Badge>
          )}
        </div>

        {onReset && activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-6 px-2 text-[11px] text-[#5c9ead] hover:text-[#326273] gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Filter sections */}
      <div className="py-1">{children}</div>
    </aside>
  )
}
