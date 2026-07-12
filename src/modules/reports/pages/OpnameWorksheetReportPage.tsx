import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportError } from '../components/ReportError'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import type { ReportParams } from '../types/reports.types'

export default function OpnameWorksheetReportPage() {
  const [opnameIdInput, setOpnameIdInput] = useState('')
  const [activeParams, setActiveParams] = useState<ReportParams & { opname_id?: number } | null>({})

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'opname-worksheet', activeParams],
    queryFn: () => reportsApi.opnameWorksheet(activeParams!),
    enabled: !!activeParams,
  })
  const report = data?.data
  const opname = report?.opname ?? null
  const rows = report?.rows ?? []
  const totals = report?.totals

  const handleSubmit = () => {
    const id = parseInt(opnameIdInput, 10)
    setActiveParams(id ? { opname_id: id } : {})
  }

  return (
    <WorkspaceLayout title="Kertas Kerja Opname" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Kertas Kerja Opname' }]}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Parameter</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="opname-id" className="text-[11px] font-medium text-[#64748b]">ID Opname (kosong = terbaru)</Label>
              <Input
                id="opname-id"
                type="number"
                min={1}
                placeholder="terbaru"
                value={opnameIdInput}
                onChange={(e) => setOpnameIdInput(e.target.value)}
                className="h-8 w-40 text-[13px]"
              />
            </div>
            <Button onClick={handleSubmit} disabled={isLoading} className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]">
              {isLoading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </div>
        </div>

        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && report && !opname && (
          <div className="rounded-lg border border-[#e2e8f0] py-8 text-center text-[#94a3b8]">Tidak ada sesi opname yang cocok.</div>
        )}

        {!isLoading && !isError && opname && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-[#1e293b]">{opname.opname_number}</p>
                <p className="text-[12px] text-[#64748b]">
                  {opname.warehouse_name} · {opname.opname_date ? formatDate(opname.opname_date) : '-'} · <span className="capitalize">{opname.status}</span>
                </p>
              </div>
              {rows.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[12px]"
                  onClick={() => exportCsv(
                    `kertas-kerja-opname-${opname.opname_number}.csv`,
                    ['Kode', 'Produk', 'Gudang', 'Satuan', 'Qty Sistem', 'Qty Fisik', 'Selisih Qty', 'Harga Rata-rata', 'Selisih Nilai'],
                    rows.map((r) => [r.product_code, r.product_name, r.warehouse_name, r.unit_name, r.system_quantity, r.physical_quantity ?? '', r.difference_quantity, r.average_cost, r.difference_value])
                  )}
                >
                  Export CSV
                </Button>
              )}
            </div>

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Produk</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Satuan</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Sistem</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Fisik</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Selisih</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Selisih Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {rows.map((r) => (
                    <tr key={`${r.product_id}-${r.warehouse_id}`} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 text-[#64748b]">{r.product_code}</td>
                      <td className="px-3 py-1.5 text-[#334155]">{r.product_name}</td>
                      <td className="px-3 py-1.5 text-[#64748b]">{r.unit_name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">{r.system_quantity.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#334155]">{r.physical_quantity === null ? '—' : r.physical_quantity.toLocaleString()}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${r.difference_quantity < 0 ? 'text-red-600' : r.difference_quantity > 0 ? 'text-green-700' : 'text-[#64748b]'}`}>{r.difference_quantity.toLocaleString()}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${r.difference_value < 0 ? 'text-red-600' : r.difference_value > 0 ? 'text-green-700' : 'text-[#64748b]'}`}>{formatCurrency(r.difference_value)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-[#94a3b8]">Sesi opname ini belum memiliki baris.</td></tr>
                  )}
                </tbody>
                {totals && rows.length > 0 && (
                  <tfoot className="border-t border-[#e2e8f0] bg-[#f8fafc]">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total ({totals.counted_lines}/{totals.line_count} dihitung)</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{totals.total_system_quantity.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{totals.total_physical_quantity.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e293b]">{totals.total_difference_quantity.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-semibold ${totals.total_difference_value < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{formatCurrency(totals.total_difference_value)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
