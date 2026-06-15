import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

interface Props {
  params: ReportParams
  onEdit: () => void
  mode?: 'range' | 'as_of_date'
}

export function ReportCompactBar({ params, onEdit, mode = 'range' }: Props) {
  const paramLabel = mode === 'as_of_date'
    ? `Per ${params.as_of_date ? formatDate(params.as_of_date) : '-'}`
    : `${params.date_from ? formatDate(params.date_from) : '-'} — ${params.date_to ? formatDate(params.date_to) : '-'}`

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2">
      <SlidersHorizontal className="h-3.5 w-3.5 text-[#64748b]" />
      <span className="text-[12px] text-[#334155]">{paramLabel}</span>
      <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 px-2 text-[12px] text-[#5c9ead]" onClick={onEdit}>
        Ubah Filter
      </Button>
    </div>
  )
}
