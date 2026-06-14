import { useCallback, useMemo, useState } from 'react'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { usePermission } from './usePermission'
import { useToast } from './useToast'
import type { DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import type { DocumentStatus } from '@/types/common.types'

export type DocumentEditMode = 'editable' | 'readonly' | 'locked'
export type DocumentActionId = 'save_draft' | 'approve' | 'reject' | 'post' | 'void'

export interface DocumentBase {
  id?: number | string | null
  status: DocumentStatus
  module: string
  number?: string
  isSystemGenerated?: boolean
}

interface DocumentActionHandlers {
  onSaveDraft?: () => Promise<void> | void
  onApprove?: () => Promise<void> | void
  onReject?: () => Promise<void> | void
  onPost?: () => Promise<void> | void
  onVoid?: (reason: string) => Promise<void> | void
}

interface UseDocumentActionsOptions {
  document: DocumentBase
  hasPostedDependences?: boolean
  handlers: DocumentActionHandlers
}

function getEditMode(
  status: DocumentStatus,
  hasPostedDependences: boolean,
  isSystemGenerated?: boolean,
): DocumentEditMode {
  if (isSystemGenerated) return 'readonly'
  if (status === 'draft') return 'editable'
  if (status === 'void') return 'readonly'
  if (status === 'posted' && hasPostedDependences) return 'locked'
  return 'readonly'
}

/** Computes permission-aware document actions and wraps async handlers with loading/toast state. */
export function useDocumentActions({
  document,
  hasPostedDependences = false,
  handlers,
}: UseDocumentActionsOptions) {
  const { settings } = useCompanyStore()
  const { can } = usePermission()
  const { toast } = useToast()
  const [loadingAction, setLoadingAction] = useState<DocumentActionId | null>(null)
  const [isVoidDialogOpen, setVoidDialogOpen] = useState(false)

  const isAutoPost = settings?.auto_post ?? true
  const isNew = !document.id
  const editMode = getEditMode(document.status, hasPostedDependences, document.isSystemGenerated)

  const runAction = useCallback(
    async (
      actionId: DocumentActionId,
      handler: (() => Promise<void> | void) | undefined,
      successMessage: string,
    ) => {
      if (!handler || loadingAction) return
      setLoadingAction(actionId)
      try {
        await handler()
        toast.success(successMessage)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Aksi dokumen gagal.'
        toast.error(message)
      } finally {
        setLoadingAction(null)
      }
    },
    [loadingAction, toast],
  )

  const availableActions = useMemo<DocumentActionButton[]>(() => {
    if (document.isSystemGenerated || editMode === 'locked' || document.status === 'void') return []

    const permission = (action: DocumentActionId) => `${document.module}.${action}`
    const actions: DocumentActionButton[] = []

    if (isAutoPost) {
      if (isNew && can(`${document.module}.create`) && handlers.onPost) {
        actions.push({
          id: 'post',
          label: 'Post',
          variant: 'primary',
          permission: `${document.module}.create`,
          onClick: () => void runAction('post', handlers.onPost, 'Dokumen berhasil diposting.'),
          isLoading: loadingAction === 'post',
        })
      }
      if (document.status === 'posted' && !hasPostedDependences && can(permission('void')) && handlers.onVoid) {
        actions.push({
          id: 'void',
          label: 'Void',
          variant: 'destructive',
          permission: permission('void'),
          onClick: () => setVoidDialogOpen(true),
          isLoading: loadingAction === 'void',
        })
      }
      return actions
    }

    if (isNew || document.status === 'draft') {
      if (can(`${document.module}.create`) && handlers.onSaveDraft) {
        actions.push({
          id: 'save_draft',
          label: 'Simpan Draft',
          variant: 'secondary',
          permission: `${document.module}.create`,
          onClick: () => void runAction('save_draft', handlers.onSaveDraft, 'Draft berhasil disimpan.'),
          isLoading: loadingAction === 'save_draft',
        })
      }
      if (can(permission('post')) && handlers.onPost) {
        actions.push({
          id: 'post',
          label: 'Post',
          variant: 'primary',
          permission: permission('post'),
          onClick: () => void runAction('post', handlers.onPost, 'Dokumen berhasil diposting.'),
          isLoading: loadingAction === 'post',
        })
      } else if (can(permission('approve')) && handlers.onApprove) {
        actions.push({
          id: 'approve',
          label: 'Approve',
          variant: 'primary',
          permission: permission('approve'),
          onClick: () => void runAction('approve', handlers.onApprove, 'Dokumen berhasil di-approve.'),
          isLoading: loadingAction === 'approve',
        })
      }
    }

    if (document.status === 'approved') {
      if (can(permission('post')) && handlers.onPost) {
        actions.push({
          id: 'post',
          label: 'Post',
          variant: 'primary',
          permission: permission('post'),
          onClick: () => void runAction('post', handlers.onPost, 'Dokumen berhasil diposting.'),
          isLoading: loadingAction === 'post',
        })
      }
      if ((can(permission('reject')) || can(permission('approve'))) && handlers.onReject) {
        actions.push({
          id: 'reject',
          label: 'Reject',
          variant: 'neutral',
          permission: can(permission('reject')) ? permission('reject') : permission('approve'),
          onClick: () => void runAction('reject', handlers.onReject, 'Dokumen berhasil ditolak.'),
          isLoading: loadingAction === 'reject',
        })
      }
    }

    if (document.status === 'posted' && !hasPostedDependences && can(permission('void')) && handlers.onVoid) {
      actions.push({
        id: 'void',
        label: 'Void',
        variant: 'destructive',
        permission: permission('void'),
        onClick: () => setVoidDialogOpen(true),
        isLoading: loadingAction === 'void',
      })
    }

    return actions
  }, [can, document, editMode, handlers, hasPostedDependences, isAutoPost, isNew, loadingAction, runAction])

  const confirmVoid = async (reason: string) => {
    await runAction('void', () => handlers.onVoid?.(reason), 'Dokumen berhasil di-void.')
    setVoidDialogOpen(false)
  }

  return {
    availableActions,
    editMode,
    loadingAction,
    isVoidDialogOpen,
    openVoidDialog: () => setVoidDialogOpen(true),
    closeVoidDialog: () => setVoidDialogOpen(false),
    confirmVoid,
  }
}
