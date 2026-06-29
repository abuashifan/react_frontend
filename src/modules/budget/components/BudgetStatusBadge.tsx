import { cn } from '@/lib/utils'
import type { BudgetSubmissionStatus } from '../types/budget.types'

const STATUS_LABELS: Record<BudgetSubmissionStatus, string> = {
  draft: 'Draf',
  submitted: 'Diajukan',
  approved_by_head: 'Disetujui Kepala',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

const STATUS_CLASSES: Record<BudgetSubmissionStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-700',
  approved_by_head: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

interface Props {
  status: BudgetSubmissionStatus
}

export function BudgetStatusBadge({ status }: Props) {
  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium', STATUS_CLASSES[status])}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
