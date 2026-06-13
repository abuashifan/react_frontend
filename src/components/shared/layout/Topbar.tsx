import { useNavigate } from 'react-router-dom'
import { LogOut, User, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { useUIStore } from '@/stores/useUIStore'
import { authApi } from '@/modules/auth/services/authApi'
import { MODULE_CONFIGS } from '@/router/moduleConfig'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="w-8 h-8 rounded-full bg-[#5c9ead] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-[11px] font-semibold">{initials}</span>
    </div>
  )
}

export function Topbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { activeCompany } = useCompanyStore()
  const { activeModule, setActiveModule, setActiveRibbonItem } = useUIStore()
  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // Ignore errors on logout
    }
    logout()
    navigate('/login', { replace: true })
  }

  function handleModuleClick(moduleId: string, path: string) {
    setActiveModule(moduleId)
    setActiveRibbonItem(null)
    navigate(path)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[52px] bg-[#326273] z-50 flex items-center px-4 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3">
        <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-[11px]">S</span>
        </div>
        <span className="text-white font-semibold text-[13px] hidden lg:block whitespace-nowrap">
          {APP_NAME}
        </span>
      </div>

      {/* Module Tabs */}
      <nav className="flex items-center flex-1 overflow-x-auto no-scrollbar">
        {MODULE_CONFIGS.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => handleModuleClick(mod.id, mod.path)}
            className={cn(
              'flex-shrink-0 px-3 py-3 text-[13px] font-medium transition-colors whitespace-nowrap',
              'border-b-2 h-[52px] flex items-center',
              activeModule === mod.id
                ? 'text-white border-[#e39774]'
                : 'text-white/70 border-transparent hover:text-white hover:bg-white/[0.08]',
            )}
          >
            {mod.label}
          </button>
        ))}
      </nav>

      {/* Right: Company + User */}
      <div className="flex items-center gap-3 ml-2 flex-shrink-0">
        {activeCompany && (
          <span className="text-white/60 text-[12px] hidden md:block max-w-[140px] truncate">
            {activeCompany.name}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-1.5 outline-none">
              <UserAvatar name={user?.name ?? 'U'} />
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-[13px] font-medium text-[#24323a] truncate">{user?.name}</p>
              <p className="text-[11px] text-[#64748b] truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[13px] gap-2">
              <User className="w-4 h-4" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[13px] gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
