import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PageSetupControl } from './PageSetupControl'

interface ReportPrintToolbarProps {
  /** Slot untuk aksi tambahan spesifik laporan, mis. Export CSV / Simpan Laporan. */
  extra?: React.ReactNode
}

/**
 * Deretan alat laporan: aksi spesifik laporan + ukuran kertas + cetak.
 * Dirender di dalam filter bar (`ReportCompactBar`) dan disembunyikan saat print.
 *
 * Menyediakan `TooltipProvider` untuk semua `ReportToolButton` di dalamnya,
 * termasuk yang dioper lewat `extra`.
 */
export function ReportPrintToolbar({ extra }: ReportPrintToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="no-print flex items-center gap-1">
        {extra}
        <PageSetupControl />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1.5 bg-[#5c9ead] px-2.5 text-[12px] hover:bg-[#4a8a9b]"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-[11px]">Cetak / Simpan PDF</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
