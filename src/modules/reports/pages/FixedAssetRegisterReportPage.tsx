import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ReportError } from '../components/ReportError'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency } from '@/lib/utils'

const currentMonth = new Date().toISOString().slice(0, 7)

export default function FixedAssetRegisterReportPage() {
  const [period, setPeriod] = useState(currentMonth)
  const [activeQuery, setActiveQuery] = useState<{ as_of_period: string } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'fa-register', activeQuery],
    queryFn: () => reportsApi.faRegister(activeQuery!),
    enabled: !!activeQuery,
  })

  const rows = data?.data ?? []

  return (
    <WorkspaceLayout
      title="Daftar Aktiva Tetap"
      breadcrumb={[{ label: 'Laporan' }, { label: 'Aktiva Tetap' }, { label: 'Daftar Aktiva Tetap' }]}
    >
      <div className="space-y-4">
        {/* Filter */}
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Parameter Laporan
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="fa-reg-period" className="text-[11px] font-medium text-[#64748b]">
                Per Bulan
              </Label>
              <input
                id="fa-reg-period"
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

        {activeQuery && !isLoading && !isError && (
          <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#64748b]">
                    <th className="px-3 py-2 text-left">No. Aset</th>
                    <th className="px-3 py-2 text-left">Nama Aset</th>
                    <th className="px-3 py-2 text-left">Kategori</th>
                    <th className="px-3 py-2 text-left">Departemen</th>
                    <th className="px-3 py-2 text-left">Tgl. Perolehan</th>
                    <th className="px-3 py-2 text-right">Harga Perolehan</th>
                    <th className="px-3 py-2 text-right">Akum. Penyusutan</th>
                    <th className="px-3 py-2 text-right">Nilai Buku</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                        Tidak ada data aktiva tetap pada periode ini.
                      </td>
                    </tr>
                  )}
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 font-mono text-[12px] text-[#334155]">{row.asset_number}</td>
                      <td className="px-3 py-1.5 text-[#1e293b]">{row.asset_name}</td>
                      <td className="px-3 py-1.5 text-[#64748b]">{row.category ?? '—'}</td>
                      <td className="px-3 py-1.5 text-[#64748b]">{row.department ?? '—'}</td>
                      <td className="px-3 py-1.5 tabular-nums text-[#64748b]">{row.acquisition_date ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">
                        {formatCurrency(row.acquisition_cost)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                        {formatCurrency(row.accumulated_depreciation_until_period)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#1e293b]">
                        {formatCurrency(row.net_book_value_as_of_period)}
                      </td>
                      <td className="px-3 py-1.5 text-[12px] text-[#64748b]">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
