import { useNavigate } from 'react-router-dom'
import { DOMAIN_BY_PATH } from '../constants/reportCategories'
import { cn } from '@/lib/utils'

interface ReportDomainPanelProps {
  domainId: string
}

export function ReportDomainPanel({ domainId }: ReportDomainPanelProps) {
  const navigate = useNavigate()
  const domain = DOMAIN_BY_PATH[domainId]

  if (!domain) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {domain.reports.map((report) => (
        <button
          key={report.id}
          type="button"
          disabled={report.comingSoon}
          onClick={() => navigate(report.path)}
          className={cn(
            'flex flex-col gap-1 rounded-lg border border-[#e2e8f0] bg-white p-4 text-left transition-all',
            report.comingSoon
              ? 'cursor-not-allowed opacity-50'
              : 'hover:border-[#5c9ead] hover:shadow-sm',
          )}
        >
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-[#1e293b]">{report.title}</p>
            {report.comingSoon && (
              <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b]">
                Segera
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#64748b]">{report.description}</p>
        </button>
      ))}
    </div>
  )
}
