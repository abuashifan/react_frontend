import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { DocumentStatusBadge } from './DocumentStatusBadge'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'
import type { DocumentStatus } from '@/types/common.types'

export interface DocumentActionButton {
  id: string
  label: string
  variant: 'primary' | 'secondary' | 'destructive' | 'neutral'
  permission?: string
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  tooltip?: string
}

interface DocumentActionBarProps {
  documentStatus: DocumentStatus
  documentNumber?: string
  actions: DocumentActionButton[]
}

function buttonClass(variant: DocumentActionButton['variant']) {
  if (variant === 'primary') {
    return 'border-0 bg-[#e39774] text-white shadow-[0_2px_6px_rgba(227,151,116,0.3)] hover:bg-[#d4845e]'
  }
  if (variant === 'destructive') {
    return 'border border-[#fecaca] bg-white text-[#991B1B] hover:border-[#ef4444] hover:bg-[#fef2f2]'
  }
  if (variant === 'secondary') {
    return 'border border-[#d9e2e5] bg-white text-[#326273] hover:border-[#5c9ead] hover:bg-[#f8fbfc]'
  }
  return 'border border-[#d9e2e5] bg-white text-[#64748b] hover:bg-[#f8fbfc]'
}

/** Fixed bottom document action bar with permission-aware buttons. */
export function DocumentActionBar({ documentStatus, documentNumber, actions }: DocumentActionBarProps) {
  const { can } = usePermission()
  const visibleActions = actions.filter((action) => !action.permission || can(action.permission))
  const hasLoading = visibleActions.some((action) => action.isLoading)

  if (visibleActions.length === 0) return null

  return (
    <FixedBottomBar
      left={
        <>
          {documentNumber && <span className="font-semibold text-[#24323a]">{documentNumber}</span>}
          {documentNumber && <span className="text-[#d9e2e5]">·</span>}
          <DocumentStatusBadge status={documentStatus} size="sm" />
        </>
      }
    >
      {visibleActions.map((action) => (
        <Button
          key={action.id}
          type="button"
          title={action.tooltip}
          onClick={action.onClick}
          disabled={action.disabled || (hasLoading && !action.isLoading)}
          className={cn('h-8 rounded-md px-4 text-[13px] font-medium', buttonClass(action.variant))}
        >
          {action.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {action.isLoading ? 'Memproses...' : action.label}
        </Button>
      ))}
    </FixedBottomBar>
  )
}
