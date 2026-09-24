import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useOBStatus } from '@/modules/opening-balance/hooks/useOpeningBalance'

/**
 * Dua hal soal saldo awal yang harus terlihat tanpa dicari — Fase 8.
 *
 * 1. **Perantara belum ditutup.** Selama saldonya bukan nol, neraca memuat pos
 *    "Saldo Awal (Perantara)" yang bukan akun sungguhan. Ia gampang terlupakan
 *    justru karena laporannya tetap seimbang.
 * 2. **Kartu aset belum sama dengan buku besarnya.** Ini bukan galat — aset
 *    boleh didaftarkan sebagian — tapi orang yang menunda pendaftaran sisanya
 *    perlu diingatkan bahwa masih ada yang menunggu.
 *
 * Diam sepenuhnya saat keduanya beres, dan saat perusahaan memang belum punya
 * saldo awal sama sekali.
 */
export function OpeningBalanceAlert() {
  const { data, isSuccess } = useOBStatus()
  const openTab = useOpenPrimaryTab()

  if (!isSuccess) return null

  const status = data.data
  const clearingOpen = status.journal_count > 0 && Math.abs(status.clearing_balance) >= 0.01
  const registerDiffers = status.fixed_asset_reconciliation.has_difference

  if (!clearingOpen && !registerDiffers) return null

  const openBoard = () =>
    openTab({
      id: 'accounting-opening-balance',
      menuKey: 'opening-balance',
      label: 'Saldo Awal',
      module: 'accounting',
      path: '/opening-balance',
    })

  return (
    <section className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#92400E]" />
          <div className="text-[13px] text-[#92400E]">
            <p className="font-semibold">Saldo awal belum selesai</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {clearingOpen && (
                <li>
                  Akun perantara masih {formatCurrency(Math.abs(status.clearing_balance))} dan belum
                  ditutup ke ekuitas.
                </li>
              )}
              {registerDiffers && (
                <li>Saldo akun aset tetap belum sama dengan kartu aset yang terdaftar.</li>
              )}
            </ul>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-8 gap-1.5 border-[#FCD34D] text-[12px] text-[#92400E] hover:bg-[#FEF3C7]"
          onClick={openBoard}
        >
          Buka Saldo Awal <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  )
}
