import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet } from 'lucide-react'
import { reportsApi } from '../services/reportsApi'
import type { ReportParams } from '../types/reports.types'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function EfakturExportPage() {
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [downloading, setDownloading] = useState<'sales' | 'purchase' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const params: ReportParams = { start_date: startDate, end_date: endDate }

  const handleDownload = async (kind: 'sales' | 'purchase') => {
    setDownloading(kind)
    setError(null)
    try {
      if (kind === 'sales') await reportsApi.downloadEfakturSales(params)
      else await reportsApi.downloadEfakturPurchase(params)
    } catch {
      setError('Gagal mengunduh berkas E-Faktur. Coba lagi.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <WorkspaceLayout title="Ekspor E-Faktur" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Pajak', path: '/reports/tax' }, { label: 'Ekspor E-Faktur' }]}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode Masa Pajak</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="efaktur-start-date" className="text-[11px] font-medium text-[#64748b]">Dari Tanggal</Label>
              <Input id="efaktur-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 w-40 text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="efaktur-end-date" className="text-[11px] font-medium text-[#64748b]">Sampai Tanggal</Label>
              <Input id="efaktur-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 w-40 text-[13px]" />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1e293b]">
              <FileSpreadsheet className="h-4 w-4 text-[#5c9ead]" /> E-Faktur Keluaran (Penjualan)
            </div>
            <p className="text-[12px] text-[#64748b]">Faktur penjualan taxable yang sudah diposting, format CSV DJP siap diimpor ke aplikasi e-Faktur.</p>
            <Button onClick={() => handleDownload('sales')} disabled={downloading !== null} className="h-8 w-fit bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {downloading === 'sales' ? 'Menyiapkan...' : 'Unduh CSV Penjualan'}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1e293b]">
              <FileSpreadsheet className="h-4 w-4 text-[#5c9ead]" /> E-Faktur Masukan (Pembelian)
            </div>
            <p className="text-[12px] text-[#64748b]">Tagihan pembelian taxable yang sudah diposting, memakai nomor Faktur Pajak vendor.</p>
            <Button onClick={() => handleDownload('purchase')} disabled={downloading !== null} className="h-8 w-fit bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {downloading === 'purchase' ? 'Menyiapkan...' : 'Unduh CSV Pembelian'}
            </Button>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
