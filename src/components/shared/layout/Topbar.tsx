import { useNavigate } from 'react-router-dom'
import { LogOut, User, Building2 } from 'lucide-react'
import {
  Database, BookMarked, Banknote,
  ShoppingCart, ShoppingBag, Boxes, Building, FileBarChart2, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { useTabStore } from '@/stores/useTabStore'
import type { ModuleKey } from '@/stores/useTabStore'
import { authApi } from '@/modules/auth/services/authApi'
import { TOP_MODULES } from '@/router/moduleConfig'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

const MODULE_ICONS: Record<string, LucideIcon> = {
  'master-data': Database,
  accounting:   BookMarked,
  'cash-bank':  Banknote,
  sales:        ShoppingCart,
  purchase:     ShoppingBag,
  inventory:    Boxes,
  'fixed-assets': Building,
  reports:      FileBarChart2,
  settings:     Settings,
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="w-8 h-8 rounded-full bg-[#5c9ead] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-[11px] font-semibold leading-none">{initials}</span>
    </div>
  )
}

export function Topbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { activeCompany } = useCompanyStore()
  const { activeModule, isRibbonOpen, setActiveModule, openRibbon, closeRibbon } = useTabStore()

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    }
    logout()
    navigate('/login', { replace: true })
  }

  function handleModuleClick(moduleId: string) {
    const moduleKey = moduleId as ModuleKey
    if (activeModule === moduleKey && isRibbonOpen) {
      closeRibbon()
      return
    }

    setActiveModule(moduleKey)
    openRibbon()
  }

  function handleSwitchCompany() {
    navigate('/select-company')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[52px] bg-[#326273] z-50 flex items-center px-4 gap-2">
      {/* Logo mark + product name */}
      <div className="flex items-center gap-2 mr-3 flex-shrink-0">
        <div className="w-6 h-6 rounded-[6px] bg-[#5c9ead] flex items-center justify-center flex-shrink-0">
          <div className="w-[9px] h-[9px] rounded-[2px] bg-white/92" />
        </div>
        <span className="text-white font-semibold text-[14px] hidden md:block whitespace-nowrap">
          {APP_NAME}
        </span>
      </div>

      {/* Divider antara logo dan nav */}
      <div className="w-px h-5 bg-white/20 flex-shrink-0 mx-1" />

      {/* Module tabs — icon only with tooltip */}
      <TooltipProvider delayDuration={300}>
        <nav
          className="flex items-stretch flex-1 overflow-x-auto no-scrollbar"
          aria-label="Modul"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeRibbon()
          }}
        >
          {TOP_MODULES.map((mod) => {
            const Icon = MODULE_ICONS[mod.id]
            const isActive = activeModule === mod.id

            return (
              <Tooltip key={mod.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={mod.label}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleModuleClick(mod.id)
                    }}
                    className={cn(
                      'flex-shrink-0 w-10 h-[52px] flex items-end justify-center pb-[10px]',
                      'transition-colors border-b-2 focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset',
                      isActive
                        ? 'text-white border-[#e39774] bg-white/[0.08]'
                        : 'text-white/70 border-transparent hover:text-white hover:bg-white/[0.08]',
                    )}
                  >
                    {Icon && <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.75} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={4}
                  className="text-[12px] px-2 py-1 bg-[#1e3a44] text-white border-none shadow-md"
                >
                  {mod.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </TooltipProvider>

      {/* Right: company name + avatar */}
      <div className="flex items-center gap-3 ml-2 flex-shrink-0">
        {activeCompany && (
          <span className="text-white/70 text-[13px] hidden md:block max-w-[140px] truncate">
            {activeCompany.name}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full"
              aria-label="Menu pengguna"
            >
              <UserAvatar name={user?.name ?? 'U'} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-[70] w-[180px] border border-[#d9e2e5] shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          >
            <div className="px-3 py-2">
              <p className="text-[14px] font-medium text-[#24323a] truncate">{user?.name}</p>
              <p className="text-[12px] text-[#64748b] truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSwitchCompany}
              className="text-[14px] gap-2 py-[7px] px-3 hover:bg-[#f8fbfc]"
            >
              <Building2 className="w-4 h-4" />
              Ganti Perusahaan
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[14px] gap-2 py-[7px] px-3 hover:bg-[#f8fbfc]">
              <User className="w-4 h-4" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[14px] gap-2 py-[7px] px-3 text-red-700 focus:text-red-700 hover:bg-[#f8fbfc]"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
