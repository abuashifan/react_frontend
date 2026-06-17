import { useNavigate } from 'react-router-dom'
import { ChevronRight, Eye } from 'lucide-react'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { SystemGeneratedBadge } from '@/components/shared/document/SystemGeneratedBadge'
import { documentReadOnlyReason } from '@/components/shared/document/documentEditPolicy'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem, DocumentStatus } from '@/types/common.types'

interface FormLayoutProps {
  title: string
  documentNumber?: string
  status?: DocumentStatus
  breadcrumb?: BreadcrumbItem[]
  isSystemGenerated?: boolean
  /** Tampilkan banner read-only di atas form (Audit-12 A12-10). */
  readOnly?: boolean
  /** Override alasan read-only; default diturunkan dari `status`. */
  readOnlyReason?: string
  bottomBar?: React.ReactNode
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

/** Layout for create/edit/detail form pages. Hides ribbon and sidebar; adds bottom bar slot. */
export function FormLayout({
  title,
  documentNumber,
  status,
  breadcrumb,
  isSystemGenerated,
  readOnly,
  readOnlyReason,
  bottomBar,
  children,
}: FormLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Document header */}
      <div className="flex-shrink-0 bg-white border-b border-[#d9e2e5] px-4 lg:px-6 py-3">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[15px] lg:text-base font-semibold text-[#24323a]">{title}</h1>
          {documentNumber && (
            <span className="text-[13px] font-medium text-[#64748b]">#{documentNumber}</span>
          )}
          {status && <DocumentStatusBadge status={status} />}
          {isSystemGenerated && <SystemGeneratedBadge />}
        </div>
      </div>

      {/* Form content */}
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto p-4 lg:p-6',
          bottomBar && 'pb-[calc(56px+var(--shell-safe-bottom)+16px)]',
        )}
      >
        <div className="max-w-[1200px]">
          {readOnly && (
            <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5 text-[#475569]">
              <Eye className="h-4 w-4 shrink-0" />
              <p className="text-[12px]">{readOnlyReason ?? documentReadOnlyReason(status)}</p>
            </div>
          )}
          {children}
        </div>
      </div>

      {/* Fixed bottom bar slot */}
      {bottomBar}
    </div>
  )
}
