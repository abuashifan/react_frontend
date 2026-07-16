import { useTabStore } from '@/stores/useTabStore'
import { usePermission } from '@/hooks/usePermission'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { MODULE_MAP } from '@/router/moduleConfig'
import type { RibbonItem } from '@/router/moduleConfig'
import { cn } from '@/lib/utils'

function RibbonItemButton({
  item,
  isActive,
  onClick,
}: {
  item: RibbonItem
  isActive: boolean
  onClick: () => void
}) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1 px-2.5 h-full min-w-[60px] max-w-[84px]',
        'transition-colors duration-100 border-b-2 flex-shrink-0',
        isActive
          ? 'bg-[#EFF9FB] border-[#5c9ead]'
          : 'border-transparent hover:bg-[#f8fbfc]',
      )}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] flex-shrink-0',
          isActive ? 'text-[#5c9ead]' : 'text-[#64748b]',
        )}
      />
      <span
        className={cn(
          'text-[10px] font-medium text-center w-full leading-[11px] line-clamp-2 break-words',
          isActive ? 'text-[#326273] font-semibold' : 'text-[#64748b]',
        )}
      >
        {item.label}
      </span>
    </button>
  )
}

export function RibbonPanel() {
  const {
    activeModule,
    activePrimaryTabId,
    isRibbonOpen,
    closeRibbon,
    primaryTabs,
  } = useTabStore()
  const { can, permissionsLoaded } = usePermission()
  const openTab = useOpenPrimaryTab()
  const activePrimaryTab = primaryTabs.find((tab) => tab.id === activePrimaryTabId)

  if (!activeModule) return null

  const moduleId = activeModule
  const moduleConfig = MODULE_MAP[moduleId]

  const visibleItems = (moduleConfig?.ribbonItems ?? []).filter(
    (item) => !permissionsLoaded || !item.permission || can(item.permission),
  )

  // Modul tanpa item ribbon (mis. Laporan) tidak boleh memunculkan panel kosong.
  if (visibleItems.length === 0) return null

  function handleItemClick(item: RibbonItem) {
    openTab({
      id: `${activeModule}-${item.id}`,
      menuKey: item.id,
      label: item.label,
      module: moduleId,
      path: item.path,
    })
    closeRibbon()
  }

  const activeId = activePrimaryTab?.module === activeModule ? activePrimaryTab.menuKey : null

  return (
    <div
      className={cn(
        'no-print fixed left-0 right-0 top-[52px] z-[60] h-[64px] overflow-hidden bg-white border-b border-[#d9e2e5]',
        'transition-all duration-150 ease-out',
        isRibbonOpen
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-1 opacity-0 pointer-events-none',
      )}
    >
      <div className="flex h-[64px] items-stretch overflow-x-auto overflow-y-hidden no-scrollbar px-1">
        {visibleItems.map((item) => (
          <RibbonItemButton
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>
    </div>
  )
}
