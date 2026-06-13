import { cn } from '@/lib/utils'
import type { DocumentStatus } from '@/types/common.types'

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  size?: 'sm' | 'md'
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  confirmed: 'Confirmed',
  posted: 'Posted',
  partially_paid: 'Sebagian Dibayar',
  paid: 'Lunas',
  void: 'Void',
  cancelled: 'Dibatalkan',
  rejected: 'Ditolak',
  delivered: 'Terkirim',
  received: 'Diterima',
  converted: 'Dikonversi',
}

const STATUS_CLASSES: Record<DocumentStatus, string> = {
  draft: 'status-draft',
  submitted: 'status-submitted',
  approved: 'status-approved',
  confirmed: 'status-confirmed',
  posted: 'status-posted',
  partially_paid: 'status-partially-paid',
  paid: 'status-paid',
  void: 'status-void',
  cancelled: 'status-cancelled',
  rejected: 'status-rejected',
  delivered: 'status-delivered',
  received: 'status-received',
  converted: 'status-converted',
}

/** Status badge for all document types. Always use this — never hardcode status styling. */
export function DocumentStatusBadge({ status, size = 'md' }: DocumentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'status-badge',
        STATUS_CLASSES[status],
        size === 'sm' && 'text-[10px] px-2 py-0',
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
