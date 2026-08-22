import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecordNavButtonsProps {
  /** Simpan isian lalu buka record yang diinput sebelumnya. */
  onPrev: () => void
  /** Simpan isian lalu buka record berikutnya, atau form kosong bila sudah paling akhir. */
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  /** Di record terbaru: Next berarti simpan lalu buka form kosong. */
  nextCreatesNew: boolean
  isBusy?: boolean
}

/**
 * Navigasi antar record dalam satu modul, ikon saja.
 *
 * Keduanya menyimpan isian dulu sebelum berpindah. Saat sudah di record terbaru,
 * tombol kanan menyimpan lalu membuka form kosong — tetap satu tombol Next yang
 * sama, jadi ikonnya sengaja tidak diganti; hanya tooltip yang menyesuaikan.
 * Ikon berbeda pernah dicoba dan terbaca sebagai tombol ketiga.
 */
export function RecordNavButtons({
  onPrev,
  onNext,
  canPrev,
  canNext,
  nextCreatesNew,
  isBusy = false,
}: RecordNavButtonsProps) {
  const nextLabel = nextCreatesNew ? 'Simpan & buat baru' : 'Simpan & ke record berikutnya'

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onPrev}
        disabled={isBusy || !canPrev}
        title="Simpan & ke record sebelumnya"
        aria-label="Simpan dan buka record sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onNext}
        disabled={isBusy || !canNext}
        title={nextLabel}
        aria-label={nextLabel}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
