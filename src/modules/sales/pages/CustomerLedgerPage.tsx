import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useCustomerLedger } from '../hooks/useArData'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { CustomerLedgerEntry } from '../types/ar.types'

const TYPE_LABELS: Record<CustomerLedgerEntry['type'], string> = {
  invoice: 'Invoice',
  receipt: 'Penerimaan',
  return: 'Retur',
  deposit: 'Deposit',
  deposit_allocation: 'Alokasi Deposit',
}

export default function CustomerLedgerPage() {
  const { customerId: paramCustomerId } = useParams()
  const [customerId, setCustomerId] = useState<number | undefined>(paramCustomerId ? Number(paramCustomerId) : undefined)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useCustomerLedger(customerId, {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const entries = data?.data ?? []
  const lastBalance = entries.length > 0 ? entries[entries.length - 1].running_balance : 0

  return (
    <WorkspaceLayout
      title="Buku Besar Customer"
      breadcrumb={[{ label: 'Sales' }, { label: 'AR' }, { label: 'Buku Besar Customer' }]}
    >
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Customer</Label>
          <SearchableSelect
            value={customerId ?? null}
            onChange={(v) => setCustomerId(v ?? undefined)}
            onSearch={(q) => kontakApi.search(q, 'customer')}
            placeholder="Pilih customer..."
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
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Debit</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Kredit</th>
                <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Memuat data...</td></tr>
              ) : !customerId ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Pilih customer untuk melihat buku besarnya.</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada transaksi pada periode ini.</td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                    <td className="px-3 py-2.5 text-[#64748b]">{formatDate(entry.date)}</td>
                    <td className="px-3 py-2.5 text-[12px] text-[#64748b]">{TYPE_LABELS[entry.type]}</td>
                    <td className="px-3 py-2.5 font-medium text-[#24323a]">{entry.number}</td>
                    <td className="px-3 py-2.5 text-[#64748b]">{entry.description}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : <span className="text-[#e2e8f0]">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#065F46]">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : <span className="text-[#e2e8f0]">-</span>}
                    </td>
                    <td className={cn('px-3 py-2.5 text-right tabular-nums font-medium', entry.running_balance < 0 ? 'text-[#991B1B]' : 'text-[#24323a]')}>
                      {formatCurrency(Math.abs(entry.running_balance))}{entry.running_balance < 0 ? ' (K)' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mt-3 flex justify-end">
          <div className="rounded-lg border border-[#d9e2e5] bg-white px-4 py-2 text-[13px]">
            <span className="text-[#64748b]">Saldo Akhir:</span>
            <span className={cn('ml-3 tabular-nums font-semibold text-[15px]', lastBalance < 0 ? 'text-[#991B1B]' : 'text-[#24323a]')}>
              {formatCurrency(Math.abs(lastBalance))}{lastBalance < 0 ? ' (Kredit)' : ''}
            </span>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  )
}
