import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { cn } from '@/lib/utils'

/**
 * Indikator kompak di topbar — bukan strip banner terpisah, supaya tidak
 * menambah tinggi shell dan melanggar anggaran tinggi viewport tablet
 * (spec-23). Muncul hanya saat masa tenggang atau ≤14 hari lagi (H-14);
 * `none`/`active` jauh dari jatuh tempo/`expired` (client sudah tidak bisa
 * login sama sekali di kasus itu) tidak menampilkan apa pun.
 */
export function SubscriptionWarningBadge() {
  const subscription = useSubscriptionStatus()

  if (!subscription) return null

  const isGrace = subscription.state === 'grace'
  const daysLeft = subscription.days_remaining

  const dueSoon = subscription.state === 'active' && daysLeft !== null && daysLeft <= 14

  if (!isGrace && !dueSoon) return null

  const label = isGrace
    ? `Langganan berakhir — akses penuh sisa ${Math.max(0, 7 - Math.abs(daysLeft ?? 0))} hari tenggang`
    : `Langganan berakhir ${daysLeft} hari lagi`

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={subscription.renewal_url ?? undefined}
            target={subscription.renewal_url ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium flex-shrink-0 transition-colors',
              isGrace
                ? 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#fecaca]'
                : 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#fde9a8]',
              !subscription.renewal_url && 'cursor-default',
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden tabular-nums">
              {isGrace ? 'Tenggang' : `${daysLeft}h`}
            </span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4} className="text-[12px] max-w-[240px]">
          {isGrace
            ? 'Langganan sudah berakhir. Akses masih penuh selama masa tenggang — setelah itu login akan ditolak sampai diperpanjang.'
            : 'Langganan akan segera berakhir. Perpanjang sebelum tanggal berakhir supaya akses tidak terputus.'}
          {subscription.renewal_url && ' Klik untuk memperpanjang lewat WhatsApp.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
