import { FileText } from 'lucide-react'
import { useTabStore } from '@/stores/useTabStore'
import { DOMAIN_BY_PATH, filterReports } from '../constants/reportCategories'
import { cn } from '@/lib/utils'

interface ReportDomainPanelProps {
  domainId: string
  /** Saring laporan berdasarkan judul/deskripsi. Kosong = tampilkan semua. */
  searchQuery?: string
}

export function ReportDomainPanel({ domainId, searchQuery = '' }: ReportDomainPanelProps) {
  const activePrimaryTabId = useTabStore((s) => s.activePrimaryTabId)
  const openSecondaryTab = useTabStore((s) => s.openSecondaryTab)
  const domain = DOMAIN_BY_PATH[domainId]

  if (!domain) return null

  const reports = filterReports(domain.reports, searchQuery)
  if (reports.length === 0) return null

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {reports.map((report) => (
        <button
          key={report.id}
          type="button"
          disabled={report.comingSoon}
          onClick={() => {
            if (!activePrimaryTabId) return
            openSecondaryTab(activePrimaryTabId, {
              id: report.id,
              label: report.title,
              type: 'form',
              path: report.path,
              pinned: false,
            })
          }}
          className={cn(
            'flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4 text-left transition-all',
            report.comingSoon
              ? 'cursor-not-allowed opacity-50'
              : 'hover:border-[#5c9ead] hover:shadow-sm',
          )}
        >
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#5c9ead]" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-[#1e293b]">{report.title}</p>
              {report.comingSoon && (
                <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b]">
                  Segera
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#64748b]">{report.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
