import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useTabStore } from '@/stores/useTabStore'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks/useToast'
import { MODULE_MAP } from '@/router/moduleConfig'
import type { RibbonItem } from '@/router/moduleConfig'
import { cn } from '@/lib/utils'

const MAX_PRIMARY_TABS = 10

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
  const navigate = useNavigate()
  const location = useLocation()
  const { activeModule, activeRibbonItem, isRibbonCollapsed, isFormView, setActiveRibbonItem, toggleRibbon } =
    useUIStore()
  const { openPrimaryTab, primaryTabs } = useTabStore()
  const { can } = usePermission()
  const { toast } = useToast()

  // Ribbon is hidden in form view and on dashboard
  if (isFormView || !activeModule || activeModule === 'dashboard') return null

  const moduleConfig = MODULE_MAP[activeModule]
  if (!moduleConfig || moduleConfig.ribbonItems.length === 0) return null

  const visibleItems = moduleConfig.ribbonItems.filter(
    (item) => !item.permission || can(item.permission),
  )

  function handleItemClick(item: RibbonItem) {
    if (primaryTabs.length >= MAX_PRIMARY_TABS) {
      toast.warning('Maksimal 10 tab dapat dibuka sekaligus. Tutup tab yang tidak diperlukan.')
      return
    }
    setActiveRibbonItem(item.id)
    openPrimaryTab({
      menuKey: item.id,
      label: item.label,
      module: activeModule!,
    })
    navigate(item.path)
  }

  // Detect active ribbon item from URL if not in store
  const activeId =
    activeRibbonItem ??
    visibleItems.find((item) => location.pathname.startsWith(item.path))?.id ??
    null

  return (
    <>
      {/* Ribbon panel */}
      <div
        className={cn(
          'fixed top-[52px] left-0 right-0 z-40 bg-white border-b border-[#d9e2e5]',
          'transition-all duration-200 ease-out',
          isRibbonCollapsed ? 'h-0 overflow-hidden opacity-0 pointer-events-none' : 'h-[64px]',
        )}
      >
        <div className="flex items-stretch h-[64px] overflow-x-auto no-scrollbar pl-1 pr-8">
          {visibleItems.map((item) => (
            <RibbonItemButton
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>

        {/* Collapse button — sticky right, fade shadow */}
        <button
          type="button"
          onClick={toggleRibbon}
          aria-label="Sembunyikan ribbon"
          className={cn(
            'absolute right-0 top-0 w-8 h-[64px]',
            'flex items-center justify-center',
            'bg-white text-[#64748b] hover:text-[#326273] transition-colors',
            'shadow-[-8px_0_10px_rgba(255,255,255,0.95)]',
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Floating expand button — visible only when ribbon is collapsed */}
      {isRibbonCollapsed && (
        <button
          type="button"
          onClick={toggleRibbon}
          aria-label="Tampilkan ribbon"
          className={cn(
            'fixed top-[52px] right-2 z-[45]',
            'flex items-center px-2 py-0.5',
            'text-[12px] text-[#64748b] hover:text-[#326273] transition-colors',
            'bg-white border border-[#d9e2e5] rounded-[5px]',
            'shadow-[0_2px_6px_rgba(0,0,0,0.08)]',
          )}
        >
          » Ribbon
        </button>
      )}
    </>
  )
}
