import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useVendorLedger } from '../hooks/useApData'
import { kontakApi } from '@/modules/master-data/services/kontakApi'

export default function VendorLedgerPage() {
  const { vendorId: paramVendorId } = useParams()
  const [selectedVendor, setSelectedVendor] = useState<number | null>(paramVendorId ? Number(paramVendorId) : null)

  const vendorId = selectedVendor
  const { data, isLoading } = useVendorLedger(vendorId)
  const ledger = data?.data

  return (
    <WorkspaceLayout
      title="Ledger Vendor"
      breadcrumb={[{ label: 'Pembelian' }, { label: 'AP' }, { label: 'Ledger Vendor' }]}
    >
      <div className="mb-4 w-72">
        <Label className="mb-1 block text-[11px] font-semibold uppercase text-[#64748b]">Vendor</Label>
        <SearchableSelect
          value={selectedVendor}
          onChange={(v) => setSelectedVendor(v)}
          onSearch={(q) => kontakApi.search(q, 'supplier')}
          placeholder="Pilih vendor..."
        />
      </div>

      {ledger && (
        <p className="mb-2 text-[13px] font-semibold text-[#334155]">{ledger.vendor_name}</p>
      )}

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
              ) : !vendorId ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Pilih vendor untuk melihat ledger</td></tr>
              ) : !ledger?.entries.length ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#94a3b8]">Tidak ada transaksi</td></tr>
              ) : ledger.entries.map((entry, i) => (
                <tr key={i} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fbfc]">
                  <td className="px-3 py-2 tabular-nums text-[#64748b]">{formatDate(entry.date)}</td>
                  <td className="px-3 py-2 text-[#94a3b8]">{entry.type}</td>
                  <td className="px-3 py-2 font-medium text-[#5c9ead]">{entry.number}</td>
                  <td className="px-3 py-2 text-[#334155]">{entry.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(entry.running_balance)}</td>
                </tr>
              ))}
            </tbody>
            {ledger && (
              <tfoot>
                <tr className="border-t-2 border-[#d9e2e5] bg-[#f8fafc]">
                  <td colSpan={6} className="px-3 py-2.5 text-[11px] font-bold uppercase text-[#64748b]">Saldo Akhir</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-bold">{formatCurrency(ledger.ending_balance)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
