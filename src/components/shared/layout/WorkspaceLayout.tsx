import { useNavigate } from 'react-router-dom'
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTabStore } from '@/stores/useTabStore'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types/common.types'

interface WorkspaceLayoutProps {
  /** Wajib kecuali `hideHeader` diaktifkan. */
  title?: string
  breadcrumb?: BreadcrumbItem[]
  action?: React.ReactNode
  sidebar?: React.ReactNode
  /**
   * Sembunyikan baris header (breadcrumb + judul) dan rapatkan padding atas.
   *
   * Dipakai halaman laporan: nama halaman sudah terbaca di tab, jadi header
   * hanya memakan ruang vertikal yang dibutuhkan dokumen laporan.
   * Jangan pakai bersama `sidebar` — tombol toggle sidebar ada di header.
   */
  hideHeader?: boolean
  /**
   * Baris alat yang menempel tepat di bawah chrome dan melebar penuh, di luar
   * area scroll — dipakai filter bar Laporan supaya terlihat menyatu dengan tab.
   */
  toolbar?: React.ReactNode
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
  hideHeader = false,
  toolbar,
  children,
}: WorkspaceLayoutProps) {
  const { isSidebarCollapsed, toggleSidebar } = useTabStore()
  const hasSidebar = !!sidebar

  return (
    <div className="flex h-full min-h-0 overflow-hidden" data-print-shell>
      {/* Filter Sidebar */}
      {hasSidebar && (
        <aside
          className={cn(
            'no-print flex-shrink-0 bg-white border-r border-[#d9e2e5] transition-all duration-200 overflow-hidden',
            isSidebarCollapsed ? 'w-0' : 'w-[220px]',
          )}
        >
          <div className="h-full w-[220px] overflow-y-auto p-3">{sidebar}</div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden" data-print-shell>
        {/* Page header */}
        {!hideHeader && (
        <div className="no-print flex flex-shrink-0 items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-[#d9e2e5]">
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
        )}

        {/* Toolbar — chrome yang menempel di bawah baris tab, tidak ikut scroll. */}
        {toolbar && (
          <div className="no-print flex-shrink-0 border-b border-[#d9e2e5] bg-white">
            {toolbar}
          </div>
        )}

        {/* Table / content */}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto p-3 md:p-4 lg:p-6',
            // Tanpa header, padding atas dirapatkan supaya konten tidak terdorong jauh.
            hideHeader && 'pt-2 md:pt-2 lg:pt-3',
            toolbar && 'pt-3 md:pt-3 lg:pt-4',
          )}
          data-print-content
        >
          {children}
        </div>
      </div>
    </div>
  )
}
