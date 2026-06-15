import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ReportParams } from '../types/reports.types'

interface Props {
  params: ReportParams
  onChange: (p: Partial<ReportParams>) => void
  onSubmit: () => void
  mode?: 'range' | 'as_of_date'
  isLoading?: boolean
}

export function ReportFilterParameter({ params, onChange, onSubmit, mode = 'range', isLoading }: Props) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Parameter Laporan</p>
      <div className="flex flex-wrap items-end gap-3">
        {mode === 'range' ? (
          <>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-[#64748b]">Dari Tanggal</Label>
              <Input type="date" value={params.date_from ?? ''} onChange={(e) => onChange({ date_from: e.target.value })} className="h-8 w-40 text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-[#64748b]">Sampai Tanggal</Label>
              <Input type="date" value={params.date_to ?? ''} onChange={(e) => onChange({ date_to: e.target.value })} className="h-8 w-40 text-[13px]" />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium text-[#64748b]">Per Tanggal</Label>
            <Input type="date" value={params.as_of_date ?? ''} onChange={(e) => onChange({ as_of_date: e.target.value })} className="h-8 w-40 text-[13px]" />
          </div>
        )}
        <Button onClick={onSubmit} disabled={isLoading} className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]">
          {isLoading ? 'Memuat...' : 'Tampilkan'}
        </Button>
      </div>
    </div>
  )
}
