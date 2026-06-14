import { useNavigate } from 'react-router-dom'
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTabStore } from '@/stores/useTabStore'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types/common.types'

interface WorkspaceLayoutProps {
  title: string
  breadcrumb?: BreadcrumbItem[]
  action?: React.ReactNode
  sidebar?: React.ReactNode
  children: React.ReactNode
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center gap-1 text-[11px] text-[#64748b] mb-1">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          {item.path ? (
            <button
              type="button"
              onClick={() => navigate(item.path!)}
              className="hover:text-[#326273] transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#24323a] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

/** Layout for list/workspace pages with optional filter sidebar */
export function WorkspaceLayout({
  title,
  breadcrumb,
  action,
  sidebar,
  children,
}: WorkspaceLayoutProps) {
  const { isSidebarCollapsed, toggleSidebar } = useTabStore()
  const hasSidebar = !!sidebar

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Filter Sidebar */}
      {hasSidebar && (
        <aside
          className={cn(
            'flex-shrink-0 bg-white border-r border-[#d9e2e5] transition-all duration-200 overflow-hidden',
            isSidebarCollapsed ? 'w-0' : 'w-[220px]',
          )}
        >
          <div className="h-full w-[220px] overflow-y-auto p-3">{sidebar}</div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        {/* Page header */}
        <div className="flex flex-shrink-0 items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-[#d9e2e5]">
          <div className="flex items-center gap-2 min-w-0">
            {hasSidebar && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="text-[#64748b] hover:text-[#326273] transition-colors flex-shrink-0"
                title={isSidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
            <div className="min-w-0">
              {breadcrumb && <Breadcrumb items={breadcrumb} />}
              <h1 className="text-[15px] lg:text-base font-semibold text-[#24323a] truncate">
                {title}
              </h1>
            </div>
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{action}</div>}
        </div>

        {/* Table / content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">{children}</div>
      </div>
    </div>
  )
}
