import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import { useOBStatus } from '@/modules/opening-balance/hooks/useOpeningBalance'

interface Props {
  onComplete: (skipped: boolean) => void
  onBack: () => void
}

/**
 * Saldo awal kini dikelola di modul khusus (/opening-balance) yang memakai konsep
 * batch backend. Step ini hanya menampilkan status & mengarahkan ke modul tersebut.
 */
export function Step5OpeningBalance({ onComplete, onBack }: Props) {
  const { data, isLoading } = useOBStatus()
  const status = data?.data
  const batch = status?.batch ?? null
  const hasBatch = !!batch && status?.status !== 'not_started'
  const isPosted = batch?.status === 'posted' || batch?.status === 'locked'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#24323a]">Saldo Awal Akun</h3>
        <button
          type="button"
          onClick={() => onComplete(true)}
          className="text-[13px] text-[#5c9ead] transition-colors hover:text-[#326273]"
        >
          Lewati, isi nanti →
        </button>
      </div>

      <p className="text-[13px] text-[#64748b]">
        Saldo awal dikelola di halaman khusus menggunakan konsep batch (draft → validasi → posting).
        Buka halaman Saldo Awal untuk menginput posisi keuangan awal perusahaan.
      </p>

      {isLoading ? (
        <div className="flex h-20 items-center justify-center text-[13px] text-[#64748b]">Memuat status...</div>
      ) : hasBatch && batch ? (
        <div className="space-y-2 rounded-lg border border-[#d9e2e5] bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#64748b]">Batch</span><span className="font-medium text-[#24323a]">{batch.batch_number}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]"><span className="text-[#64748b]">Total Debit</span><span className="tabular-nums font-medium">{formatCurrency(batch.total_debit)}</span></div>
          <div className="flex items-center justify-between text-[12px]"><span className="text-[#64748b]">Total Kredit</span><span className="tabular-nums font-medium">{formatCurrency(batch.total_credit)}</span></div>
          <div className="flex items-center justify-between border-t border-[#d9e2e5] pt-1 text-[12px]">
            <span className="font-semibold text-[#334155]">Selisih</span>
            <span className={cn('tabular-nums font-semibold', Math.abs(batch.difference) < 0.01 ? 'text-green-700' : 'text-red-600')}>{formatCurrency(batch.difference)}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#d9e2e5] p-4 text-center text-[13px] text-[#94a3b8]">
          Belum ada saldo awal yang diinput.
        </div>
      )}

      <a href="/opening-balance" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5c9ead] hover:text-[#326273]">
        <ExternalLink className="h-3.5 w-3.5" /> Buka Halaman Saldo Awal
      </a>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button type="button" onClick={() => onComplete(!isPosted)} className="bg-[#e39774] px-6 hover:bg-[#d4845e]">
          Lanjutkan →
        </Button>
      </div>
    </div>
  )
}
