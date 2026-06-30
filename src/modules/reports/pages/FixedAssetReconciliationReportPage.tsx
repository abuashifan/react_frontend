import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'

const currentMonth = new Date().toISOString().slice(0, 7)

export default function FixedAssetReconciliationReportPage() {
  const [period, setPeriod] = useState(currentMonth)
  const [activeQuery, setActiveQuery] = useState<{ as_of_period: string } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'fa-reconciliation', activeQuery],
    queryFn: () => reportsApi.faReconciliation(activeQuery!),
    enabled: !!activeQuery,
  })

  const report = data?.data

  const rows = report
    ? [
        {
          label: 'Harga Perolehan',
          register: report.asset_register_cost_total,
          gl: report.gl_fixed_asset_cost_balance,
          diff: report.difference_cost,
        },
        {
          label: 'Akumulasi Penyusutan',
          register: report.asset_register_accumulated_depreciation,
          gl: report.gl_accumulated_depreciation_balance,
          diff: report.difference_accumulated_depreciation,
        },
        {
          label: 'Nilai Buku Bersih',
          register: report.asset_register_net_book_value,
          gl: report.gl_net_book_value,
          diff: report.asset_register_net_book_value - report.gl_net_book_value,
        },
      ]
    : []

  return (
    <WorkspaceLayout
      title="Rekonsiliasi Aktiva Tetap"
      breadcrumb={[{ label: 'Laporan' }, { label: 'Aktiva Tetap' }, { label: 'Rekonsiliasi Aktiva Tetap' }]}
    >
      <div className="space-y-4">
        {/* Filter */}
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Parameter Laporan
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="fa-rec-period" className="text-[11px] font-medium text-[#64748b]">
                Per Bulan
              </Label>
              <input
                id="fa-rec-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-8 w-40 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]"
              />
            </div>
            <Button
              onClick={() => setActiveQuery({ as_of_period: period })}
              disabled={!period || isLoading}
              className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]"
            >
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>

        {isError && <ReportError />}

        {report && (
          <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
            <div className="px-4 py-3 border-b border-[#f1f5f9]">
              <p className="text-[13px] font-semibold text-[#1e293b]">
                Rekonsiliasi per {report.period}
              </p>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#64748b]">
                  <th className="px-4 py-2 text-left">Komponen</th>
                  <th className="px-4 py-2 text-right">Register Aset</th>
                  <th className="px-4 py-2 text-right">Buku Besar (GL)</th>
                  <th className="px-4 py-2 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-[#f1f5f9]">
                    <td className="px-4 py-2 font-medium text-[#334155]">{row.label}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-[#334155]">
                      {formatCurrency(row.register)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-[#334155]">
                      {formatCurrency(row.gl)}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums font-semibold ${Math.abs(row.diff) < 0.01 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                      {Math.abs(row.diff) < 0.01 ? 'Seimbang' : formatCurrency(row.diff)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
