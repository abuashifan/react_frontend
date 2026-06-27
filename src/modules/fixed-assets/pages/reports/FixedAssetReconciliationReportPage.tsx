import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fixedAssetApi } from '../../services/fixedAssetApi'
import { FixedAssetReportTable } from './FixedAssetReportTable'

export default function FixedAssetReconciliationReportPage() {
  const currentPeriod = new Date().toISOString().slice(0, 7)
  const [asOfPeriod, setAsOfPeriod] = useState(new Date().toISOString().slice(0, 7))
  const query = useQuery({
    queryKey: ['fixed-assets', 'reports', 'reconciliation', asOfPeriod],
    queryFn: () => fixedAssetApi.reports.reconciliation({ as_of_period: asOfPeriod }),
    enabled: Boolean(asOfPeriod),
  })

  return (
    <WorkspaceLayout
      title="Rekonsiliasi Aktiva Tetap"
      breadcrumb={[{ label: 'Aktiva Tetap' }, { label: 'Rekonsiliasi' }]}
      action={
        <div className="flex items-center gap-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</Label>
          <Input type="month" value={asOfPeriod} max={currentPeriod} onChange={(event) => setAsOfPeriod(event.target.value)} className="h-8 w-[145px] text-[13px] tabular-nums" />
        </div>
      }
    >
      <FixedAssetReportTable data={query.data?.data} isLoading={query.isLoading} />
    </WorkspaceLayout>
  )
}
