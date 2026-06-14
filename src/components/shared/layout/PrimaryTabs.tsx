import { X } from 'lucide-react'
import { useTabStore } from '@/stores/useTabStore'
import { cn } from '@/lib/utils'

interface PrimaryTabsProps {
  top: number
}

export function PrimaryTabs({ top }: PrimaryTabsProps) {
  const { primaryTabs, activePrimaryTabId, activatePrimaryTab, closePrimaryTab } = useTabStore()

  if (primaryTabs.length === 0) return null

  return (
    <div
      className="fixed left-0 right-0 z-[38] bg-white border-b border-[#d9e2e5] flex items-stretch overflow-x-auto no-scrollbar"
      style={{ top, height: 36 }}
    >
      {primaryTabs.map((tab) => {
        const isActive = tab.id === activePrimaryTabId
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => activatePrimaryTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 h-full cursor-pointer select-none flex-shrink-0',
              'text-[13px] whitespace-nowrap border-r border-[#d9e2e5] border-b-2 transition-colors',
              isActive
                ? 'bg-white text-[#326273] font-medium border-b-[#5c9ead]'
                : 'bg-[#f8fbfc] text-[#64748b] border-b-transparent hover:bg-[#eef4f5] hover:text-[#326273]',
            )}
          >
            <span>{tab.label}</span>
            <button
              type="button"
              aria-label={`Tutup tab ${tab.label}`}
              onClick={(e) => {
                e.stopPropagation()
                closePrimaryTab(tab.id)
              }}
              className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#991B1B] transition-colors flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
