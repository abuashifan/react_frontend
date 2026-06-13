import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import type { BreadcrumbItem, DocumentStatus } from '@/types/common.types'

interface FormLayoutProps {
  title: string
  documentNumber?: string
  status?: DocumentStatus
  breadcrumb?: BreadcrumbItem[]
  isSystemGenerated?: boolean
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
  bottomBar,
  children,
}: FormLayoutProps) {
  const { setFormView } = useUIStore()

  // Signal AppShell that we're in form view — hides ribbon
  useEffect(() => {
    setFormView(true)
    return () => setFormView(false)
  }, [setFormView])

  return (
    <div className={bottomBar ? 'pb-[60px]' : undefined}>
      {/* Document header */}
      <div className="bg-white border-b border-[#d9e2e5] px-4 lg:px-6 py-3">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[15px] lg:text-base font-semibold text-[#24323a]">{title}</h1>
          {documentNumber && (
            <span className="text-[13px] font-medium text-[#64748b]">#{documentNumber}</span>
          )}
          {status && <DocumentStatusBadge status={status} />}
          {isSystemGenerated && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-full">
              🔧 System Generated
            </span>
          )}
        </div>
      </div>

      {/* Form content */}
      <div className="p-4 lg:p-6 max-w-[1200px]">{children}</div>

      {/* Fixed bottom bar slot */}
      {bottomBar}
    </div>
  )
}
