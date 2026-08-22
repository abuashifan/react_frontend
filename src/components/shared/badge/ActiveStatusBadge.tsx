import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ActiveStatusBadgeProps {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}

/** Badge Aktif/Nonaktif untuk record master data dengan flag `is_active`.
 * Selalu pakai ini — jangan hardcode styling status aktif/nonaktif. */
export function ActiveStatusBadge({
  isActive,
  activeLabel = 'Aktif',
  inactiveLabel = 'Nonaktif',
  className,
}: ActiveStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        'text-[11px] px-2 py-0.5 rounded-full',
        isActive
          ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]'
          : 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
        className,
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}
