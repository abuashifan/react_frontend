import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

interface Props {
  params: ReportParams
  onOpenModal: () => void
  mode?: 'range' | 'as_of_date'
  /** Ringkasan filter aktif selain tanggal, mis. "Pelanggan: PT ABC" (Fase 14). */
  filterSummary?: string
  /** Ringkasan kolom tampil, mis. "5 kolom" (Fase 14). */
  columnSummary?: string
}

export function ReportCompactBar({ params, onOpenModal, mode = 'range', filterSummary, columnSummary }: Props) {
  const paramLabel = mode === 'as_of_date'
    ? `Per ${params.as_of_date ? formatDate(params.as_of_date) : '-'}`
    : `${params.start_date ? formatDate(params.start_date) : '-'} — ${params.end_date ? formatDate(params.end_date) : '-'}`

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2">
      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[#64748b]" />
      <span className="text-[12px] text-[#334155]">{paramLabel}</span>
      {filterSummary && <span className="text-[12px] text-[#64748b]">· {filterSummary}</span>}
      {columnSummary && <span className="text-[12px] text-[#64748b]">· {columnSummary}</span>}
      <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 shrink-0 px-2 text-[12px] text-[#5c9ead]" onClick={onOpenModal}>
        Ubah Filter
      </Button>
    </div>
  )
}
