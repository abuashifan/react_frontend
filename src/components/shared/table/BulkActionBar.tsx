import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/shared/PermissionGuard'

export interface BulkAction {
  id?: string
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
    <div className="mb-2 flex h-10 items-center gap-3 rounded-lg border border-[#5c9ead] bg-[#EFF9FB] px-3 md:px-4">
      <span className="text-[13px] font-medium text-[#326273]">
        {selectedCount} item dipilih
      </span>
      <button
        type="button"
        onClick={onClearSelection}
        className="flex items-center gap-1 text-[12px] text-[#64748b] transition-colors hover:text-[#24323a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]"
        aria-label="Batal pilih semua"
      >
        <X className="w-3.5 h-3.5" />
        <span>Batalkan pilihan</span>
      </button>

      <div className="flex-1" />

      <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
        {actions.map((action) => {
          const btn = (
            <Button
              key={action.id ?? action.label}
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
              <PermissionGuard key={action.id ?? action.label} permission={action.permission}>
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
