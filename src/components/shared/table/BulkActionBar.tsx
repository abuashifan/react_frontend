import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  onClick: (selectedIds: string[]) => void
  permission?: string
  variant?: 'default' | 'destructive'
}

interface BulkActionBarProps {
  selectedCount: number
  selectedIds: string[]
  actions: BulkAction[]
  onClearSelection: () => void
}

export function BulkActionBar({ selectedCount, selectedIds, actions, onClearSelection }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#e8f4f6] border-b border-[#d9e2e5]">
      <button
        onClick={onClearSelection}
        className="flex items-center gap-1.5 text-[12px] text-[#326273] hover:text-[#24323a] transition-colors"
        aria-label="Batal pilih semua"
      >
        <X className="w-3.5 h-3.5" />
        <span className="font-medium">{selectedCount} dipilih</span>
      </button>

      <div className="h-4 w-px bg-[#b0c8cf]" />

      <div className="flex items-center gap-2">
        {actions.map((action, idx) => {
          const btn = (
            <Button
              key={idx}
              size="sm"
              variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
              onClick={() => action.onClick(selectedIds)}
              className="h-7 text-[12px] gap-1.5"
            >
              {action.icon}
              {action.label}
            </Button>
          )

          if (action.permission) {
            return (
              <PermissionGuard key={idx} permission={action.permission}>
                {btn}
              </PermissionGuard>
            )
          }

          return btn
        })}
      </div>
    </div>
  )
}
