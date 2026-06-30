import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'

const currentMonth = new Date().toISOString().slice(0, 7)
const firstMonthOfYear = currentMonth.slice(0, 4) + '-01'

interface ActiveQuery {
  period_from: string
  period_to: string
  mode: 'detail' | 'yearly_summary'
}

export default function FixedAssetDepreciationReportPage() {
  const [periodFrom, setPeriodFrom] = useState(firstMonthOfYear)
  const [periodTo, setPeriodTo] = useState(currentMonth)
  const [mode, setMode] = useState<'detail' | 'yearly_summary'>('detail')
  const [activeQuery, setActiveQuery] = useState<ActiveQuery | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'fa-depreciation', activeQuery],
    queryFn: () => reportsApi.faDepreciation(activeQuery!),
    enabled: !!activeQuery,
  })

  const report = data?.data

  return (
    <WorkspaceLayout
      title="Laporan Penyusutan"
      breadcrumb={[{ label: 'Laporan' }, { label: 'Aktiva Tetap' }, { label: 'Laporan Penyusutan' }]}
    >
      <div className="space-y-4">
        {/* Filter */}
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Parameter Laporan
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="fa-dep-from" className="text-[11px] font-medium text-[#64748b]">
                Dari Bulan
              </Label>
              <input
                id="fa-dep-from"
                type="month"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="h-8 w-40 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="fa-dep-to" className="text-[11px] font-medium text-[#64748b]">
                Sampai Bulan
              </Label>
              <input
                id="fa-dep-to"
                type="month"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="h-8 w-40 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-[#64748b]">Mode</Label>
              <div className="flex h-8 items-center gap-3 text-[13px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value="detail"
                    checked={mode === 'detail'}
                    onChange={() => setMode('detail')}
                    className="accent-[#5c9ead]"
                  />
                  Detail
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value="yearly_summary"
                    checked={mode === 'yearly_summary'}
                    onChange={() => setMode('yearly_summary')}
                    className="accent-[#5c9ead]"
                  />
                  Ringkasan Tahunan
                </label>
              </div>
            </div>
            <Button
              onClick={() => setActiveQuery({ period_from: periodFrom, period_to: periodTo, mode })}
              disabled={!periodTo || isLoading}
              className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]"
            >
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>

        {isError && <ReportError />}

        {report && (
          <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
            <div className="overflow-x-auto">
              {report.mode === 'detail' ? (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#64748b]">
                      <th className="px-3 py-2 text-left">Periode</th>
                      <th className="px-3 py-2 text-left">No. Aset</th>
                      <th className="px-3 py-2 text-left">Nama Aset</th>
                      <th className="px-3 py-2 text-left">Kategori</th>
                      <th className="px-3 py-2 text-right">Penyusutan</th>
                      <th className="px-3 py-2 text-right">Akum. s.d. Periode</th>
                      <th className="px-3 py-2 text-right">Nilai Buku</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.lines.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                          Tidak ada data penyusutan pada periode ini.
                        </td>
                      </tr>
                    )}
                    {report.lines.map((line, idx) => (
                      <tr key={idx} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 tabular-nums text-[#64748b]">{line.period}</td>
                        <td className="px-3 py-1.5 font-mono text-[12px] text-[#334155]">{line.asset_number ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[#1e293b]">{line.asset_name ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[#64748b]">{line.category ?? '—'}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">
                          {formatCurrency(line.depreciation_amount)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                          {formatCurrency(line.accumulated_depreciation_after)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#1e293b]">
                          {formatCurrency(line.net_book_value_after)}
                        </td>
                        <td className="px-3 py-1.5 text-[12px] text-[#64748b]">{line.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#64748b]">
                      <th className="px-3 py-2 text-left">Tahun</th>
                      <th className="px-3 py-2 text-left">No. Aset</th>
                      <th className="px-3 py-2 text-left">Nama Aset</th>
                      <th className="px-3 py-2 text-right">Total Penyusutan</th>
                      <th className="px-3 py-2 text-right">Akum. Akhir Tahun</th>
                      <th className="px-3 py-2 text-right">Nilai Buku Akhir Tahun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.lines.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                          Tidak ada data penyusutan pada periode ini.
                        </td>
                      </tr>
                    )}
                    {report.lines.map((line, idx) => (
                      <tr key={idx} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 tabular-nums font-medium text-[#334155]">{line.year}</td>
                        <td className="px-3 py-1.5 font-mono text-[12px] text-[#334155]">{line.asset_number ?? '—'}</td>
                        <td className="px-3 py-1.5 text-[#1e293b]">{line.asset_name ?? '—'}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">
                          {formatCurrency(line.depreciation_year_total)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                          {formatCurrency(line.accumulated_depreciation_end_of_year)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#1e293b]">
                          {formatCurrency(line.net_book_value_end_of_year)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
