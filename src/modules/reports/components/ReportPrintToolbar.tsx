import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageSetupControl } from './PageSetupControl'

interface ReportPrintToolbarProps {
  /** Slot untuk aksi tambahan spesifik laporan, mis. tombol Export CSV / Simpan Laporan. */
  extra?: React.ReactNode
}

/** Toolbar di atas dokumen print-preview: ukuran kertas + cetak. Disembunyikan saat print. */
export function ReportPrintToolbar({ extra }: ReportPrintToolbarProps) {
  return (
    <div className="no-print flex items-center justify-end gap-2">
      {extra}
      <PageSetupControl />
      <Button type="button" size="sm" className="h-8 gap-1.5 text-[12px]" onClick={() => window.print()}>
        <Printer className="h-3.5 w-3.5" />
        Cetak / Simpan PDF
      </Button>
    </div>
  )
}
