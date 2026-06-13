import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { usePermission } from '@/hooks/usePermission'
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
        'flex flex-col items-center justify-center gap-1 px-3 h-full min-w-[72px] max-w-[88px]',
        'transition-colors duration-100 border-b-2 flex-shrink-0',
        isActive
          ? 'bg-[#EFF9FB] border-[#5c9ead]'
          : 'border-transparent hover:bg-[#f8fbfc]',
      )}
    >
      <Icon
        className={cn(
          'w-5 h-5',
          isActive ? 'text-[#5c9ead]' : 'text-[#64748b] group-hover:text-[#5c9ead]',
        )}
      />
      <span
        className={cn(
          'text-[11px] font-medium leading-tight text-center whitespace-nowrap',
          isActive ? 'text-[#326273] font-bold' : 'text-[#64748b]',
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
  const { activeModule, activeRibbonItem, isRibbonCollapsed, setActiveRibbonItem, toggleRibbon } =
    useUIStore()
  const { can } = usePermission()

  if (!activeModule || activeModule === 'dashboard') return null

  const moduleConfig = MODULE_MAP[activeModule]
  if (!moduleConfig || moduleConfig.ribbonItems.length === 0) return null

  const visibleItems = moduleConfig.ribbonItems.filter(
    (item) => !item.permission || can(item.permission),
  )

  function handleItemClick(item: RibbonItem) {
    setActiveRibbonItem(item.id)
    navigate(item.path)
  }

  // Detect active from URL if not in store
  const activeId =
    activeRibbonItem ??
    visibleItems.find((item) => location.pathname.startsWith(item.path))?.id ??
    null

  return (
    <div
      className={cn(
        'fixed top-[52px] left-0 right-0 z-40 bg-white border-b border-[#d9e2e5]',
        'transition-all duration-200',
        isRibbonCollapsed ? 'h-0 overflow-hidden' : 'h-[64px]',
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

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleRibbon}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2',
          'w-5 h-5 flex items-center justify-center',
          'text-[#64748b] hover:text-[#326273] rounded',
        )}
        title={isRibbonCollapsed ? 'Tampilkan ribbon' : 'Sembunyikan ribbon'}
      >
        {isRibbonCollapsed ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}
