import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePermission } from '@/hooks/usePermission'
import { budgetApi } from '../services/budgetApi'
import type { BudgetSubmission } from '../types/budget.types'

interface Props {
  submission: BudgetSubmission
  onActionSuccess: () => void
}

export function BudgetApprovalActions({ submission, onActionSuccess }: Props) {
  const { can } = usePermission()
  const qc = useQueryClient()
  const [showReject, setShowReject] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['budget', 'submission', submission.id] })
    void qc.invalidateQueries({ queryKey: ['budget', 'submissions', submission.budget_period_id] })
    onActionSuccess()
  }

  const submitMut = useMutation({ mutationFn: () => budgetApi.submit(submission.id), onSuccess: invalidate })
  const approveHeadMut = useMutation({ mutationFn: () => budgetApi.approveHead(submission.id), onSuccess: invalidate })
  const approveFinanceMut = useMutation({ mutationFn: () => budgetApi.approveFinance(submission.id), onSuccess: invalidate })
  const rejectMut = useMutation({
    mutationFn: () => budgetApi.reject(submission.id, rejectNote),
    onSuccess: () => { setShowReject(false); setRejectNote(''); invalidate() },
  })

  const isLoading = submitMut.isPending || approveHeadMut.isPending || approveFinanceMut.isPending || rejectMut.isPending

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {submission.status === 'draft' && can('budgets.submit') && (
          <Button size="sm" onClick={() => submitMut.mutate()} disabled={isLoading}>
            Ajukan
          </Button>
        )}
        {submission.status === 'submitted' && can('budgets.approve_head') && (
          <>
            <Button size="sm" onClick={() => approveHeadMut.mutate()} disabled={isLoading}>
              Setujui (Kepala)
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowReject(true)} disabled={isLoading}>
              Tolak
            </Button>
          </>
        )}
        {submission.status === 'approved_by_head' && can('budgets.approve_finance') && (
          <>
            <Button size="sm" onClick={() => approveFinanceMut.mutate()} disabled={isLoading}>
              Setujui (Finance)
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowReject(true)} disabled={isLoading}>
              Tolak
            </Button>
          </>
        )}
        {submission.status === 'rejected' && can('budgets.submit') && (
          <p className="text-[12px] text-[#64748b]">
            Anggaran ditolak — revisi baris anggaran dan ajukan kembali.
          </p>
        )}
      </div>

      {showReject && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
          <Label htmlFor="reject-note" className="text-[12px] text-red-700">Alasan Penolakan</Label>
          <Textarea
            id="reject-note"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            className="text-[12px]"
            rows={2}
          />
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => rejectMut.mutate()} disabled={!rejectNote.trim() || isLoading}>
              Konfirmasi Tolak
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowReject(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
