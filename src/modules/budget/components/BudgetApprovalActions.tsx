import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { FormField } from '@/components/shared/form/FormField'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { budgetApi } from '../services/budgetApi'
import type { BudgetSubmission } from '../types/budget.types'

interface Props {
  submission: BudgetSubmission
  onActionSuccess: () => void
}

export function BudgetApprovalActions({ submission, onActionSuccess }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showReject, setShowReject] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['budget', 'submission', submission.id] })
    void qc.invalidateQueries({ queryKey: ['budget', 'submissions', submission.budget_period_id] })
    onActionSuccess()
  }

  const onError = (error: unknown, fallback: string) => toast.error(getApiErrorMessage(error, fallback))

  const submitMut = useMutation({
    mutationFn: () => budgetApi.submit(submission.id),
    onSuccess: invalidate,
    onError: (e) => onError(e, 'Gagal mengajukan anggaran.'),
  })
  const approveHeadMut = useMutation({
    mutationFn: () => budgetApi.approveHead(submission.id),
    onSuccess: invalidate,
    onError: (e) => onError(e, 'Gagal menyetujui anggaran.'),
  })
  const approveFinanceMut = useMutation({
    mutationFn: () => budgetApi.approveFinance(submission.id),
    onSuccess: invalidate,
    onError: (e) => onError(e, 'Gagal menyetujui anggaran.'),
  })
  const rejectMut = useMutation({
    mutationFn: () => budgetApi.reject(submission.id, rejectNote),
    onSuccess: () => {
      setShowReject(false)
      setRejectNote('')
      invalidate()
    },
    onError: (e) => onError(e, 'Gagal menolak anggaran.'),
  })

  /**
   * Aksi dirakit sebagai data lalu diserahkan ke `DocumentActionBar` — komponen
   * itu yang menyaring berdasarkan permission, menyeragamkan gaya tombol, dan
   * menonaktifkan aksi lain selama satu aksi berjalan (sebelumnya tiap tombol
   * di sini mengurus `disabled={isLoading}` sendiri-sendiri).
   */
  const actions: DocumentActionButton[] = []

  if (submission.status === 'draft') {
    actions.push({
      id: 'submit',
      label: 'Ajukan',
      variant: 'primary',
      permission: 'budgets.submit',
      onClick: () => submitMut.mutate(),
      isLoading: submitMut.isPending,
    })
  }

  if (submission.status === 'submitted') {
    actions.push({
      id: 'approve-head',
      label: 'Setujui (Kepala)',
      variant: 'primary',
      permission: 'budgets.approve_head',
      onClick: () => approveHeadMut.mutate(),
      isLoading: approveHeadMut.isPending,
    })
    actions.push({
      id: 'reject-head',
      label: 'Tolak',
      variant: 'destructive',
      permission: 'budgets.approve_head',
      onClick: () => setShowReject(true),
    })
  }

  if (submission.status === 'approved_by_head') {
    actions.push({
      id: 'approve-finance',
      label: 'Setujui (Finance)',
      variant: 'primary',
      permission: 'budgets.approve_finance',
      onClick: () => approveFinanceMut.mutate(),
      isLoading: approveFinanceMut.isPending,
    })
    actions.push({
      id: 'reject-finance',
      label: 'Tolak',
      variant: 'destructive',
      permission: 'budgets.approve_finance',
      onClick: () => setShowReject(true),
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {/*
          `documentStatus` sengaja dipetakan, bukan diteruskan apa adanya:
          pengajuan anggaran punya kosakata status sendiri (`approved_by_head`,
          `superseded`) yang tidak ada di `DocumentStatus`, dan lencana statusnya
          dirender `BudgetStatusBadge` di halaman induk. Pada `placement="header"`
          prop ini tidak dipakai untuk apa pun — hanya diperlukan tipenya.
        */}
        <DocumentActionBar
          placement="header"
          documentStatus={submission.status === 'approved' ? 'approved' : 'draft'}
          actions={actions}
        />

        {/* Ditolak = draf yang punya catatan penolakan; lihat BudgetSubmissionPage. */}
        {submission.status === 'draft' && submission.rejection_note && (
          <p className="text-[12px] text-[#64748b]">
            Anggaran ditolak — revisi baris anggaran dan ajukan kembali.
          </p>
        )}
      </div>

      {showReject && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <FormField label="Alasan Penolakan" htmlFor="reject-note">
            <Textarea
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="text-[12px]"
              rows={2}
            />
          </FormField>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => rejectMut.mutate()}
              disabled={!rejectNote.trim() || rejectMut.isPending}
            >
              {rejectMut.isPending ? 'Memproses...' : 'Konfirmasi Tolak'}
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
