import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fixedAssetApi } from '../../services/fixedAssetApi'
import { FixedAssetReportTable } from './FixedAssetReportTable'

export default function FixedAssetDisposalsReportPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const query = useQuery({
    queryKey: ['fixed-assets', 'reports', 'disposals', dateFrom, dateTo],
    queryFn: () => fixedAssetApi.reports.disposals({
      disposal_date_from: dateFrom,
      disposal_date_to: dateTo,
    }),
  })

  return (
    <WorkspaceLayout
      title="Laporan Disposal Aktiva"
      breadcrumb={[{ label: 'Aktiva Tetap' }, { label: 'Laporan Disposal' }]}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari</Label>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-8 w-[135px] text-[13px] tabular-nums" />
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sampai</Label>
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-8 w-[135px] text-[13px] tabular-nums" />
        </div>
      }
    >
      <FixedAssetReportTable data={query.data?.data} isLoading={query.isLoading} />
    </WorkspaceLayout>
  )
}
