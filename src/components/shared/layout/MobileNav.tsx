import { useState } from 'react'
import { ChevronLeft, ChevronRight, Home, Layers, LayoutGrid, X } from 'lucide-react'
import { useTabStore } from '@/stores/useTabStore'
import type { ModuleKey } from '@/stores/useTabStore'
import { MODULE_MAP, TOP_MODULES, isModuleVisible } from '@/router/moduleConfig'
import type { RibbonItem } from '@/router/moduleConfig'
import { MODULE_ICONS } from '@/router/moduleIcons'
import { usePermission } from '@/hooks/usePermission'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useHiddenModules } from '@/modules/settings/hooks/useCompanySettings'
import { cn } from '@/lib/utils'
import { MobileSheet } from './MobileSheet'

type SheetKind = 'menu' | 'tabs' | null

function NavButton({
  label,
  icon: Icon,
  active,
  badge,
  onClick,
}: {
  label: string
  icon: typeof Home
  active?: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5c9ead]',
        active ? 'text-[#326273]' : 'text-[#64748b]',
      )}
    >
      <span className={cn('relative flex h-7 w-12 items-center justify-center rounded-full', active && 'bg-[#e6f2f5]')}>
        <Icon aria-hidden className="h-5 w-5" />
        {!!badge && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-[#e39774] px-1 text-center text-[10px] font-bold leading-4 text-white">
            {badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </button>
  )
}

/**
 * Navigasi HP (< 768 px): menggantikan ikon modul di topbar, ribbon, dan deretan tab primer.
 * Beranda, Menu (modul lalu halaman), dan Tab (halaman yang sedang dibuka).
 */
export function MobileNav() {
  const { primaryTabs, activePrimaryTabId, setActivePrimaryTab, closePrimaryTab, setActiveModule } = useTabStore()
  const { can, canAny, permissionsLoaded } = usePermission()
  const hiddenModules = useHiddenModules()
  const openTab = useOpenPrimaryTab()
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [moduleId, setModuleId] = useState<ModuleKey | null>(null)

  const modules = TOP_MODULES.filter((module) => !hiddenModules.has(module.id) && (!permissionsLoaded || isModuleVisible(module, can)))
  const openTabs = primaryTabs.filter((tab) => tab.id !== 'dashboard')
  const current = moduleId ? MODULE_MAP[moduleId] : null
  const items = (current?.ribbonItems ?? []).filter((item) => {
    if (permissionsLoaded && item.permission && !(Array.isArray(item.permission) ? canAny(item.permission) : can(item.permission))) return false
    return true
  })

  const close = () => {
    setSheet(null)
    setModuleId(null)
  }

  function chooseModule(id: ModuleKey) {
    const config = MODULE_MAP[id]
    if (config?.opensListDirectly) {
      openTab({ id, menuKey: 'list', label: config.label, module: id, path: config.path })
      close()
      return
    }
    setModuleId(id)
  }

  function chooseItem(item: RibbonItem) {
    if (!current) return
    setActiveModule(current.id as ModuleKey)
    openTab({ id: `${current.id}-${item.id}`, menuKey: item.id, label: item.label, module: current.id as ModuleKey, path: item.path })
    close()
  }

  return (
    <>
      <nav
        aria-label="Menu utama"
        className="no-print fixed inset-x-0 bottom-0 z-[45] flex border-t border-[#d9e2e5] bg-white pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      >
        <NavButton label="Beranda" icon={Home} active={activePrimaryTabId === 'dashboard'} onClick={() => { setActivePrimaryTab('dashboard'); close() }} />
        <NavButton label="Menu" icon={LayoutGrid} active={sheet === 'menu'} onClick={() => setSheet('menu')} />
        <NavButton label="Tab" icon={Layers} badge={openTabs.length || undefined} active={sheet === 'tabs'} onClick={() => setSheet('tabs')} />
      </nav>

      <MobileSheet
        open={sheet === 'menu'}
        onOpenChange={(open) => { if (!open) close() }}
        title={current ? current.label : 'Menu'}
        description={current ? 'Pilih halaman' : 'Pilih modul'}
      >
        {current ? (
          <div>
            <button
              type="button"
              onClick={() => setModuleId(null)}
              className="flex w-full items-center gap-1 border-b border-[#f1f5f9] px-4 py-3 text-[13px] font-medium text-[#326273]"
            >
              <ChevronLeft className="h-4 w-4" /> Semua modul
            </button>
            {items.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-[#64748b]">Tidak ada halaman yang bisa Anda buka di modul ini.</p>}
            <ul>
              {items.map((item, index) => {
                const Icon = item.icon
                const heading = item.group && item.group !== items[index - 1]?.group
                return (
                  <li key={item.id}>
                    {heading && <p className="bg-[#f8fafc] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{item.group}</p>}
                    <button
                      type="button"
                      onClick={() => chooseItem(item)}
                      className="flex min-h-[48px] w-full items-center gap-3 border-b border-[#f1f5f9] px-4 text-left text-[14px] text-[#24323a] active:bg-[#f8fbfc]"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0 text-[#5c9ead]" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-[#cbd5e1]" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-2 p-3">
            {modules.map((module) => {
              const Icon = MODULE_ICONS[module.id]
              return (
                <li key={module.id}>
                  <button
                    type="button"
                    onClick={() => chooseModule(module.id as ModuleKey)}
                    className="flex h-full min-h-[84px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-1 py-3 text-center text-[12px] font-medium text-[#24323a] active:bg-[#f8fbfc]"
                  >
                    {Icon && <Icon className="h-6 w-6 text-[#326273]" />}
                    <span className="leading-tight">{module.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </MobileSheet>

      <MobileSheet
        open={sheet === 'tabs'}
        onOpenChange={(open) => { if (!open) close() }}
        title="Halaman terbuka"
        description="Pindah atau tutup halaman yang sedang dibuka"
      >
        {openTabs.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#64748b]">Belum ada halaman lain yang dibuka. Pilih dari Menu.</p>
        ) : (
          <ul>
            {openTabs.map((tab) => (
              <li key={tab.id} className="flex items-center border-b border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => { setActivePrimaryTab(tab.id); close() }}
                  className={cn('min-h-[48px] flex-1 px-4 text-left text-[14px]', tab.id === activePrimaryTabId ? 'font-semibold text-[#326273]' : 'text-[#24323a]')}
                >
                  {tab.label}
                </button>
                <button
                  type="button"
                  aria-label={`Tutup tab ${tab.label}`}
                  onClick={() => closePrimaryTab(tab.id)}
                  className="flex h-12 w-12 items-center justify-center text-[#94a3b8]"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </MobileSheet>
    </>
  )
}
