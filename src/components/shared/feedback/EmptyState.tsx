import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

/** Generic empty state for DataTable and standalone use */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
        <Inbox className="w-6 h-6 text-[#94a3b8]" />
      </div>
      <p className="text-[13px] font-medium text-[#24323a] mb-1">{title}</p>
      {description && (
        <p className="text-[12px] text-[#64748b] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
