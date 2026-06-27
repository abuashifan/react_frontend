import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fixedAssetApi } from '../../services/fixedAssetApi'
import { FixedAssetReportTable } from './FixedAssetReportTable'

export default function FixedAssetDepreciationReportPage() {
  const currentPeriod = new Date().toISOString().slice(0, 7)
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState(currentPeriod)
  const [mode, setMode] = useState<'detail' | 'yearly_summary'>('detail')
  const query = useQuery({
    queryKey: ['fixed-assets', 'reports', 'depreciation', periodFrom, periodTo, mode],
    queryFn: () => fixedAssetApi.reports.depreciation({ period_from: periodFrom, period_to: periodTo, mode }),
    enabled: Boolean(periodTo),
  })

  return (
    <WorkspaceLayout
      title="Laporan Depresiasi"
      breadcrumb={[{ label: 'Aktiva Tetap' }, { label: 'Laporan Depresiasi' }]}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari</Label>
          <Input type="month" value={periodFrom} max={currentPeriod} onChange={(event) => setPeriodFrom(event.target.value)} className="h-8 w-[135px] text-[13px] tabular-nums" />
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sampai</Label>
          <Input type="month" value={periodTo} max={currentPeriod} onChange={(event) => setPeriodTo(event.target.value)} className="h-8 w-[135px] text-[13px] tabular-nums" />
          <select value={mode} onChange={(event) => setMode(event.target.value as 'detail' | 'yearly_summary')} className="h-8 rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px]">
            <option value="detail">Detail</option>
            <option value="yearly_summary">Yearly Summary</option>
          </select>
        </div>
      }
    >
      <FixedAssetReportTable data={query.data?.data} isLoading={query.isLoading} />
    </WorkspaceLayout>
  )
}
