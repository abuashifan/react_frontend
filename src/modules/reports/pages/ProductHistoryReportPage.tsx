import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportParameterModal } from '../components/ReportParameterModal'
import { ReportCompactBar } from '../components/ReportCompactBar'
import { ReportError } from '../components/ReportError'
import { TablePagination } from '@/components/shared/table/TablePagination'
import type { PaginationState } from '@/components/shared/table/TablePagination'
import { Button } from '@/components/ui/button'
import { reportsApi } from '../services/reportsApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { useReportParams } from '../hooks/useReportParams'
import type { ProductHistoryDocumentType } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstDayOfMonth = today.slice(0, 7) + '-01'

const DOCUMENT_LABELS: Record<ProductHistoryDocumentType, string> = {
  vendor_bill: 'Beli',
  purchase_return: 'Retur Beli',
  sales_invoice: 'Jual',
  sales_return: 'Retur Jual',
}

const DOCUMENT_CLASSES: Record<ProductHistoryDocumentType, string> = {
  vendor_bill: 'bg-blue-100 text-blue-700',
  purchase_return: 'bg-blue-50 text-blue-600',
  sales_invoice: 'bg-green-100 text-green-700',
  sales_return: 'bg-green-50 text-green-600',
}

const formatQty = (value: number) =>
  value.toLocaleString('id-ID', { maximumFractionDigits: 4 })

export default function ProductHistoryReportPage() {
  const { params, setParams, activeParams, setActiveParams, showFilter, setShowFilter } =
    useReportParams({ start_date: firstDayOfMonth, end_date: today })
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 })

  // Backend mewajibkan `product_id`; tanpa itu requestnya pasti 422, jadi
  // query-nya ditahan sampai produk dipilih.
  const hasProduct = !!activeParams?.product_id

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'product-history', activeParams],
    queryFn: () => reportsApi.productHistory(activeParams!),
    enabled: hasProduct,
  })

  const report = data?.data
  const allRows = useMemo(() => report?.rows ?? [], [report])

  const pagedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return allRows.slice(start, start + pagination.pageSize)
  }, [allRows, pagination])

  const handleSubmit = () => {
    setActiveParams({ ...params })
    setShowFilter(false)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  return (
    <WorkspaceLayout
      hideHeader
      toolbar={
        <ReportCompactBar
          params={activeParams ?? params}
          onOpenModal={() => setShowFilter(true)}
          mode="range"
        />
      }
    >
      <div className="space-y-4">
        {showFilter && (
          <ReportParameterModal
            open={showFilter}
            onClose={() => setShowFilter(false)}
            params={params}
            onChange={(p) => setParams((prev) => ({ ...prev, ...p }))}
            onSubmit={handleSubmit}
            mode="range"
            contextFilters={{ product: true }}
            isLoading={isLoading}
          />
        )}

        {/* Tanpa produk, tabel kosong akan terbaca sebagai "tidak ada
            transaksi" -- padahal laporannya belum pernah dijalankan. */}
        {!hasProduct && (
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-10 text-center text-[13px] text-[#64748b]">
            Pilih produk lebih dulu lewat filter untuk melihat riwayat transaksinya.
          </div>
        )}

        {hasProduct && isLoading && (
          <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">
            Memuat laporan...
          </div>
        )}
        {hasProduct && isError && <ReportError onRetry={() => refetch()} />}

        {hasProduct && !isLoading && !isError && report && (
          <>
            {allRows.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[12px]"
                  onClick={() =>
                    exportCsv(
                      `riwayat-produk-${activeParams?.start_date ?? ''}-${activeParams?.end_date ?? ''}.csv`,
                      ['Tanggal', 'Dokumen', 'Jenis', 'Pelanggan/Supplier', 'Qty', 'Harga', 'Total'],
                      allRows.map((r) => [
                        r.date,
                        r.document_number,
                        DOCUMENT_LABELS[r.document_type],
                        r.contact_name ?? '',
                        r.quantity,
                        r.unit_price,
                        r.line_total,
                      ]),
                    )
                  }
                >
                  Export CSV
                </Button>
              </div>
            )}

            {allRows.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total Dibeli', qty: report.totals.purchased_qty, value: report.totals.purchased_value },
                  { label: 'Rata-rata Beli', qty: null, value: report.totals.avg_buy_price },
                  { label: 'Total Dijual', qty: report.totals.sold_qty, value: report.totals.sold_value },
                  { label: 'Rata-rata Jual', qty: null, value: report.totals.avg_sell_price },
                ].map((card) => (
                  <div key={card.label} className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                    <p className="text-[11px] text-[#64748b]">{card.label}</p>
                    <p className="text-[13px] font-semibold tabular-nums text-[#1e293b]">
                      {formatCurrency(card.value)}
                    </p>
                    {card.qty !== null && (
                      <p className="text-[11px] tabular-nums text-[#64748b]">{formatQty(card.qty)} unit</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jenis</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pelanggan / Supplier</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Harga</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {pagedRows.map((row) => (
                    <tr key={`${row.document_type}-${row.document_number}-${row.date}`} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 whitespace-nowrap text-[#64748b]">{formatDate(row.date)}</td>
                      <td className="px-3 py-1.5 font-medium text-[#334155]">{row.document_number}</td>
                      <td className="px-3 py-1.5">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${DOCUMENT_CLASSES[row.document_type]}`}>
                          {DOCUMENT_LABELS[row.document_type]}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-[#334155]">{row.contact_name ?? '—'}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${row.quantity < 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>
                        {formatQty(row.quantity)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">{formatCurrency(row.unit_price)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-[#1e293b]">{formatCurrency(row.line_total)}</td>
                    </tr>
                  ))}
                  {allRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#94a3b8]">
                        Produk ini tidak punya transaksi penjualan atau pembelian pada periode tersebut.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {allRows.length > 0 && (
                <TablePagination
                  pagination={pagination}
                  totalRows={allRows.length}
                  onChange={setPagination}
                  isFetching={isLoading}
                />
              )}
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
