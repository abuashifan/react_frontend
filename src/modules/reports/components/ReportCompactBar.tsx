import { CalendarRange, SlidersHorizontal } from 'lucide-react'
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
  /** Kontrol tambahan (mis. toggle Ringkasan/Rincian, Simpan Laporan, Export CSV) —
   * dirender di baris yang sama supaya laporan tidak menumpuk banyak baris toolbar
   * terpisah secara vertikal. */
  actions?: React.ReactNode
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-medium text-[#64748b]">
      {children}
    </span>
  )
}

export function ReportCompactBar({ params, onOpenModal, mode = 'range', filterSummary, columnSummary, actions }: Props) {
  const paramLabel = mode === 'as_of_date'
    ? `Per ${params.as_of_date ? formatDate(params.as_of_date) : '-'}`
    : `${params.start_date ? formatDate(params.start_date) : '-'} — ${params.end_date ? formatDate(params.end_date) : '-'}`

  return (
    // Strip datar melebar penuh: bingkai & garis bawah disediakan slot `toolbar`
    // WorkspaceLayout, supaya bar menyatu dengan baris tab di atasnya.
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-1.5 lg:px-4">
      <CalendarRange className="h-3.5 w-3.5 shrink-0 text-[#5c9ead]" />
      <span className="text-[12px] font-medium tabular-nums text-[#334155]">{paramLabel}</span>
      {filterSummary && <Chip>{filterSummary}</Chip>}
      {columnSummary && <Chip>{columnSummary}</Chip>}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 gap-1 px-2 text-[12px] text-[#5c9ead] hover:bg-[#eff9fb] hover:text-[#326273]"
        onClick={onOpenModal}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Ubah Filter
      </Button>

      {actions && (
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <div className="mx-0.5 hidden h-5 w-px bg-[#e2e8f0] sm:block" />
          {actions}
        </div>
      )}
    </div>
  )
}
