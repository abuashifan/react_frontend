import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { onboardingApi } from '../../services/onboardingApi'
import { useToast } from '@/hooks/useToast'

interface Props {
  onComplete: (skipped: boolean) => void
  onBack: () => void
}

// Common balance accounts — pre-populated for ease of entry
const BALANCE_ACCOUNTS = [
  { key: 'cash', label: 'Kas Tunai', accountId: null },
  { key: 'bank', label: 'Bank', accountId: null },
  { key: 'ar', label: 'Piutang Usaha', accountId: null },
  { key: 'inventory', label: 'Persediaan', accountId: null },
  { key: 'ap', label: 'Hutang Usaha', accountId: null },
  { key: 'equity', label: 'Modal', accountId: null },
]

interface BalanceRow {
  key: string
  label: string
  debit: string
  credit: string
}

export function Step5OpeningBalance({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const [openingDate, setOpeningDate] = useState('')
  const [rows, setRows] = useState<BalanceRow[]>(
    BALANCE_ACCOUNTS.map((a) => ({ ...a, debit: '', credit: '' })),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalDebit = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0)
  const totalCredit = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  const hasEntries = rows.some((r) => r.debit || r.credit)

  const handleSave = async () => {
    if (!openingDate) {
      toast.error('Tanggal saldo awal wajib diisi.')
      return
    }
    if (hasEntries && !isBalanced) {
      toast.error('Total debit dan kredit harus sama (selisih: ' + Math.abs(totalDebit - totalCredit).toLocaleString('id-ID') + ').')
      return
    }

    setIsSubmitting(true)
    try {
      await onboardingApi.saveOpeningBalance({
        opening_date: openingDate,
        entries: rows
          .filter((r) => r.debit || r.credit)
          .map((r) => ({
            account_id: 0, // placeholder — real implementation maps by account
            debit: parseFloat(r.debit) || 0,
            credit: parseFloat(r.credit) || 0,
          })),
      })
      toast.success('Saldo awal berhasil disimpan.')
      onComplete(false)
    } catch {
      toast.error('Gagal menyimpan saldo awal. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateRow = (key: string, field: 'debit' | 'credit', value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, [field]: value, [field === 'debit' ? 'credit' : 'debit']: value ? r[field === 'debit' ? 'credit' : 'debit'] : '' }
          : r,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#24323a]">Saldo Awal Akun</h3>
        <button
          type="button"
          onClick={() => onComplete(true)}
          className="text-[13px] text-[#5c9ead] hover:text-[#326273] transition-colors"
        >
          Lewati, isi nanti →
        </button>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-[#24323a] mb-1.5">
          Tanggal Saldo Awal <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={openingDate}
          onChange={(e) => setOpeningDate(e.target.value)}
          className="h-9 rounded-md border border-[#d9e2e5] bg-white px-3 text-[13px] text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]"
        />
      </div>

      {/* Balance table */}
      <div className="border border-[#d9e2e5] rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#d9e2e5]">
              <th className="text-left px-4 py-2.5 font-semibold text-[#24323a]">Akun</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[#24323a] w-[160px]">Debit</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[#24323a] w-[160px]">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-[#f1f5f9]">
                <td className="px-4 py-2.5 text-[#24323a]">{row.label}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.debit}
                    onChange={(e) => updateRow(row.key, 'debit', e.target.value)}
                    className="w-full h-8 rounded border border-[#d9e2e5] px-2 text-right text-[12px] tabular-nums focus:outline-none focus:border-[#5c9ead]"
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.credit}
                    onChange={(e) => updateRow(row.key, 'credit', e.target.value)}
                    className="w-full h-8 rounded border border-[#d9e2e5] px-2 text-right text-[12px] tabular-nums focus:outline-none focus:border-[#5c9ead]"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
            <tr className="bg-[#f8fafc]">
              <td className="px-4 py-2.5 text-[12px] font-semibold text-[#24323a]">Total</td>
              <td className={`px-4 py-2.5 text-right text-[12px] font-semibold tabular-nums ${!isBalanced && hasEntries ? 'text-red-500' : 'text-[#24323a]'}`}>
                {totalDebit.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
              </td>
              <td className={`px-4 py-2.5 text-right text-[12px] font-semibold tabular-nums ${!isBalanced && hasEntries ? 'text-red-500' : 'text-[#24323a]'}`}>
                {totalCredit.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {hasEntries && !isBalanced && (
        <p className="text-[12px] text-red-500">Total debit dan kredit harus sama.</p>
      )}

      <p className="text-[11px] text-[#94a3b8]">
        Tabel ini menampilkan akun umum. Untuk mapping akun yang lebih lengkap, gunakan menu Master Data → Chart of Accounts setelah setup selesai.
      </p>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || (hasEntries && !isBalanced) || !openingDate}
          className="bg-[#e39774] hover:bg-[#d4845e] px-6"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjutkan →'}
        </Button>
      </div>
    </div>
  )
}
