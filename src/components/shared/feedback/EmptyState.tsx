import { Inbox } from 'lucide-react'
import type { FC, SVGProps } from 'react'
type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: LucideIcon
}

/** Generic empty state for DataTable and standalone use */
export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f5f9]">
        <Icon className="h-6 w-6 text-[#94a3b8]" />
      </div>
      <p className="text-[14px] font-semibold text-[#24323a]">{title}</p>
      {description && (
        <p className="max-w-[260px] text-[13px] text-[#64748b]">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
