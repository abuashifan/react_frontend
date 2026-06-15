import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useInvoiceLedger } from '../hooks/useArData'
import { salesInvoiceApi } from '../services/salesInvoiceApi'
import type { InvoiceLedgerEntry } from '../types/ar.types'
import type { SalesInvoice } from '../types/salesInvoice.types'

const TYPE_LABELS: Record<InvoiceLedgerEntry['type'], string> = {
  post: 'Posting',
  payment: 'Pembayaran',
  return: 'Retur',
  void: 'Void',
  deposit_allocation: 'Alokasi Deposit',
}

export default function InvoiceLedgerPage() {
  const { invoiceId: paramInvoiceId } = useParams()
  const [invoiceId, setInvoiceId] = useState<number | undefined>(paramInvoiceId ? Number(paramInvoiceId) : undefined)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useInvoiceLedger(invoiceId, {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const entries = data?.data ?? []

  const searchInvoices = async (query: string) => {
    const res = await salesInvoiceApi.list({ page: 1, per_page: 10, search: query })
    return (res.data as SalesInvoice[]).map((inv) => ({
      value: inv.id,
      label: inv.number,
      sublabel: inv.customer?.name,
    }))
  }

  return (
    <WorkspaceLayout
      title="Buku Besar Invoice"
      breadcrumb={[{ label: 'Sales' }, { label: 'AR' }, { label: 'Buku Besar Invoice' }]}
    >
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Invoice</Label>
          <SearchableSelect
            value={invoiceId ?? null}
            onChange={(v) => setInvoiceId(v ?? undefined)}
            onSearch={searchInvoices}
            placeholder="Pilih invoice..."
          />
        </div>
        <div>
          <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Dari</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-36 text-[13px]" />
        </div>
        <div>
          <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Sampai</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-36 text-[13px]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#eeeeee]">
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Tanggal</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Tipe</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Nomor</th>
                <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Keterangan</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Jumlah</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
              ) : !invoiceId ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-[#94a3b8]">Pilih invoice untuk melihat riwayat transaksinya.</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada transaksi pada periode ini.</td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                    <td className="px-3 py-2.5 text-[#64748b]">{formatDate(entry.date)}</td>
                    <td className="px-3 py-2.5 text-[12px] text-[#64748b]">{TYPE_LABELS[entry.type]}</td>
                    <td className="px-3 py-2.5 font-medium text-[#24323a]">{entry.number}</td>
                    <td className="px-3 py-2.5 text-[#64748b]">{entry.description}</td>
                    <td className={cn('px-3 py-2.5 text-right tabular-nums font-medium', entry.amount < 0 ? 'text-[#065F46]' : 'text-[#24323a]')}>
                      {formatCurrency(Math.abs(entry.amount))}{entry.amount < 0 ? ' (K)' : ''}
                    </td>
                    <td className={cn('px-3 py-2.5 text-right tabular-nums font-semibold', entry.running_balance > 0 ? 'text-[#991B1B]' : 'text-[#065F46]')}>
                      {formatCurrency(entry.running_balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
