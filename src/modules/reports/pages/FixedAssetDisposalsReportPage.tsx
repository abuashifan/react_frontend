import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfYear = today.slice(0, 4) + '-01-01'

interface ActiveQuery {
  disposal_date_from?: string
  disposal_date_to?: string
}

export default function FixedAssetDisposalsReportPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfYear, end_date: today })
  const [activeQuery, setActiveQuery] = useState<ActiveQuery | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'fa-disposals', activeQuery],
    queryFn: () => reportsApi.faDisposals(activeQuery!),
    enabled: !!activeQuery,
  })

  const rows = data?.data ?? []

  const handleSubmit = () => {
    setActiveQuery({
      disposal_date_from: params.start_date,
      disposal_date_to: params.end_date,
    })
  }

  return (
    <WorkspaceLayout
      title="Laporan Pelepasan Aset"
      breadcrumb={[{ label: 'Laporan' }, { label: 'Aktiva Tetap' }, { label: 'Laporan Pelepasan' }]}
    >
      <div className="space-y-4">
        <ReportFilterParameter
          params={params}
          onChange={(p) => setParams((prev) => ({ ...prev, ...p }))}
          onSubmit={handleSubmit}
          mode="range"
          isLoading={isLoading}
        />

        {isError && <ReportError />}

        {activeQuery && !isLoading && !isError && (
          <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#64748b]">
                    <th className="px-3 py-2 text-left">Tgl. Pelepasan</th>
                    <th className="px-3 py-2 text-left">No. Aset</th>
                    <th className="px-3 py-2 text-left">Nama Aset</th>
                    <th className="px-3 py-2 text-left">Tipe</th>
                    <th className="px-3 py-2 text-right">Harga Jual</th>
                    <th className="px-3 py-2 text-right">Nilai Buku</th>
                    <th className="px-3 py-2 text-right">Laba/Rugi</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                        Tidak ada pelepasan aset pada periode ini.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => {
                    const gainLoss = row.gain_loss ?? 0
                    return (
                      <tr key={row.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 tabular-nums text-[#64748b]">{row.disposal_date}</td>
                        <td className="px-3 py-1.5 font-mono text-[12px] text-[#334155]">
                          {row.asset?.asset_number ?? '—'}
                        </td>
                        <td className="px-3 py-1.5 text-[#1e293b]">{row.asset?.name ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[#64748b]">{row.disposal_type}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">
                          {row.sale_price != null ? formatCurrency(row.sale_price) : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                          {row.book_value_at_disposal != null ? formatCurrency(row.book_value_at_disposal) : '—'}
                        </td>
                        <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${gainLoss >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                          {row.gain_loss != null ? formatCurrency(gainLoss) : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-[12px] text-[#64748b]">{row.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
