import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronRight, PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from 'lucide-react'
import { useTabStore } from '@/stores/useTabStore'
import { useViewMode } from '@/hooks/useViewMode'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Button } from '@/components/ui/button'
import { MobileSheet } from './MobileSheet'
import { ReportZoomViewport } from './ReportZoomViewport'

/** Halaman laporan: di HP tampil zoom-out seperti PDF, bukan disusun ulang. */
const REPORT_PATH = /^\/(reports|fixed-assets\/reports|sales\/ar|purchase\/ap)(\/|$)/
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
  const isMobile = useIsMobile()
  const { activePrimaryTab, activeSecondaryTab } = useViewMode()
  const isReportPage = REPORT_PATH.test(activeSecondaryTab?.path ?? activePrimaryTab?.path ?? '')
  const [filterOpen, setFilterOpen] = useState(false)
  const hasSidebar = !!sidebar
  // HP: filter pindah ke lembar dari bawah supaya daftar memakai seluruh lebar layar.
  const sidebarInline = hasSidebar && !isMobile

  return (
    <div className="flex h-full min-h-0 overflow-hidden" data-print-shell>
      {/* Filter Sidebar */}
      {sidebarInline && (
        <aside
          className={cn(
            'no-print flex-shrink-0 bg-white border-r border-[#d9e2e5] transition-all duration-200 overflow-hidden',
            isSidebarCollapsed ? 'w-0' : 'w-[220px]',
          )}
        >
          <div className="h-full w-[220px] overflow-y-auto p-3">{sidebar}</div>
        </aside>
      )}

      {hasSidebar && isMobile && (
        <MobileSheet
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter"
          description="Atur filter daftar"
          footer={<Button type="button" className="h-11 w-full" onClick={() => setFilterOpen(false)}>Tampilkan hasil</Button>}
        >
          <div>{sidebar}</div>
        </MobileSheet>
      )}

      {/* Main content */}
      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden" data-print-shell>
        {/* Page header */}
        {!hideHeader && (
        <div className={cn(
          'no-print flex flex-shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 bg-white border-b border-[#d9e2e5]',
          // HP: judul halaman sudah tampil di topbar; baris ini hanya dipakai bila ada filter atau aksi.
          !action && !hasSidebar && 'max-md:hidden',
        )}>
          <div className="flex items-center gap-2 min-w-0">
            {sidebarInline && (
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
              {breadcrumb && <div className="hidden md:block"><Breadcrumb items={breadcrumb} /></div>}
              <h1 className="max-md:sr-only text-[15px] lg:text-base font-semibold text-[#24323a] truncate">
                {title}
              </h1>
            </div>
          </div>
          <div className="ml-auto flex min-w-0 flex-shrink-0 flex-wrap items-center justify-end gap-2">
            {hasSidebar && isMobile && (
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setFilterOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Filter
              </Button>
            )}
            {action}
          </div>
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
          {isMobile && isReportPage ? <ReportZoomViewport>{children}</ReportZoomViewport> : children}
        </div>
      </div>
    </div>
  )
}
