import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTabStore } from '@/stores/useTabStore'
import { cn } from '@/lib/utils'

interface SecondaryTabsProps {
  top: number
}

export function SecondaryTabs({ top }: SecondaryTabsProps) {
  const navigate = useNavigate()
  const {
    primaryTabs,
    activePrimaryTabId,
    secondaryTabs,
    activeSecondaryTabId,
    setActiveSecondaryTab,
    closeSecondaryTab,
  } = useTabStore()

  if (!activePrimaryTabId || activePrimaryTabId === 'dashboard' || primaryTabs.length === 0) {
    return null
  }

  const primaryTabId = activePrimaryTabId
  const tabs = secondaryTabs[primaryTabId] ?? []
  const activeId = activeSecondaryTabId[primaryTabId]

  function activateTab(tabId: string, path: string) {
    setActiveSecondaryTab(primaryTabId, tabId)
    navigate(path)
  }

  function closeTab(tabId: string) {
    const closingIndex = tabs.findIndex((tab) => tab.id === tabId)
    const nextTabs = tabs.filter((tab) => tab.id !== tabId)
    const fallbackTab =
      nextTabs[Math.max(closingIndex - 1, 0)] ??
      nextTabs.find((tab) => tab.pinned) ??
      nextTabs[0]
    const shouldNavigate = activeId === tabId

    closeSecondaryTab(primaryTabId, tabId)

    if (shouldNavigate && fallbackTab) {
      navigate(fallbackTab.path)
    }
  }

  return (
    <div
      className="fixed left-0 right-0 z-[37] bg-[#EFEFED] border-b border-[#d9e2e5] flex items-end overflow-x-auto no-scrollbar px-2"
      style={{ top, height: 32 }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        return (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            aria-selected={isActive}
            onClick={() => activateTab(tab.id, tab.path)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                activateTab(tab.id, tab.path)
              }
            }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 flex-shrink-0 cursor-pointer select-none',
              'text-[12px] whitespace-nowrap rounded-t-[5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]',
              'border border-transparent border-b-0',
              isActive
                ? 'bg-white text-[#326273] font-medium border-[#d9e2e5]'
                : 'text-[#64748b] hover:bg-white/70 hover:text-[#326273]',
            )}
            style={{ height: 28, marginTop: 4 }}
          >
            <span>{tab.label}</span>
            {!tab.pinned && (
              <button
                type="button"
                aria-label={`Tutup ${tab.label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="w-3.5 h-3.5 rounded-[2px] flex items-center justify-center text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#991B1B] transition-colors flex-shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
