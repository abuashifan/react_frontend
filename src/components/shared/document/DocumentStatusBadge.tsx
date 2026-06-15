import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/lib/constants'
import type { DocumentStatus } from '@/types/common.types'

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  size?: 'xs' | 'sm' | 'md'
}

const STATUS_CLASSES: Record<DocumentStatus, string> = {
  draft: 'status-draft',
  submitted: 'status-submitted',
  sent: 'status-sent',
  approved: 'status-approved',
  accepted: 'status-accepted',
  issued: 'status-issued',
  confirmed: 'status-confirmed',
  ready: 'status-ready',
  shipped: 'status-shipped',
  posted: 'status-posted',
  partially_paid: 'status-partially-paid',
  paid: 'status-paid',
  partially_allocated: 'status-partially-paid',
  fully_allocated: 'status-paid',
  refunded: 'status-void',
  void: 'status-void',
  cancelled: 'status-cancelled',
  rejected: 'status-rejected',
  delivered: 'status-delivered',
  received: 'status-received',
  converted: 'status-converted',
  closed: 'status-cancelled',
}

/** Status badge for all document types. Always use this — never hardcode status styling. */
export function DocumentStatusBadge({ status, size = 'sm' }: DocumentStatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status

  return (
    <span
      aria-label={`Document status: ${label}`}
      className={cn(
        'inline-flex max-w-[120px] items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap',
        STATUS_CLASSES[status],
        size === 'xs' && 'h-5 px-1.5 text-[10px]',
        size === 'sm' && 'h-[22px] px-2 text-[11px]',
        size === 'md' && 'h-[26px] px-2.5 text-[12px]',
      )}
    >
      <span
        className={cn(
          'shrink-0 rounded-full bg-current',
          size === 'xs' ? 'h-[5px] w-[5px]' : 'h-1.5 w-1.5',
        )}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </span>
  )
}
