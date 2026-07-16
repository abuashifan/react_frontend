import type { FC, SVGProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>

interface Props {
  icon: LucideIcon
  /** Dipakai sebagai tooltip sekaligus label aksesibilitas tombol ikon. */
  label: string
  onClick?: () => void
  disabled?: boolean
  /** Teks pendek di samping ikon, mis. "A4". */
  badge?: string
  className?: string
}

/**
 * Tombol alat laporan: ikon saja + tooltip, supaya deretan alat di filter bar
 * tetap rapat tanpa kehilangan kejelasan.
 *
 * Membawa `TooltipProvider` sendiri agar bisa dipakai langsung di `actions`
 * milik `ReportCompactBar`, tidak hanya di dalam `ReportPrintToolbar`.
 */
export function ReportToolButton({ icon: Icon, label, onClick, disabled, badge, className }: Props) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              'h-7 gap-1 px-2 text-[#475569] hover:bg-[#f1f5f9] hover:text-[#326273]',
              className,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {badge && <span className="text-[11px] font-medium tabular-nums">{badge}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-[11px]">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
