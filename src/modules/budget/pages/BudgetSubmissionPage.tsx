import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import { budgetRevisionSchema } from '../schemas/budgetSchema'
import { useBudgetRevision } from '../hooks/useBudgetVersions'
import { budgetApi } from '../services/budgetApi'
import { BudgetStatusBadge } from '../components/BudgetStatusBadge'
import { BudgetLineEditor } from '../components/BudgetLineEditor'
import { BudgetApprovalActions } from '../components/BudgetApprovalActions'

/**
 * `/budget/submissions/:id` merender komponen yang sama untuk setiap pengajuan,
 * dan React Router tidak me-remount saat berpindah antar id — hanya param yang
 * berubah. Tanpa `key`, state `BudgetLineEditor` (baris RAB) dari pengajuan yang
 * dibuka sebelumnya bertahan sementara `submissionId` sudah menunjuk pengajuan
 * lain — menekan "Simpan Baris" berarti menulis baris milik pengajuan A ke
 * pengajuan B. Pola `key` yang sama dipakai `CashReceiptFormPage` dan
 * `ProyekFormPage`.
 */
export default function BudgetSubmissionPage() {
  const { id } = useParams<{ id: string }>()

  return <BudgetSubmissionPageContent key={id ?? 'none'} />
}

function BudgetSubmissionPageContent() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number(id)
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['budget', 'submission', submissionId],
    queryFn: () => budgetApi.getSubmission(submissionId),
  })
  const submission = data?.data

  const isEditable = submission?.status === 'draft' || submission?.status === 'rejected'
  // Anggaran yang sudah disetujui bersifat immutable; satu-satunya jalan
  // mengubahnya adalah membuat versi baru lewat revisi.
  const canRevise = submission?.status === 'approved'

  const { openRecordTab } = useRecordTab()
  const { toast } = useToast()
  const { revise } = useBudgetRevision(submissionId)
  const [isRevising, setRevising] = useState(false)
  const [revisionReason, setRevisionReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const handleRevise = async () => {
    const parsed = budgetRevisionSchema.safeParse({ revision_reason: revisionReason })
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? 'Alasan revisi tidak valid')
      return
    }

    try {
      const result = await revise.mutateAsync(parsed.data.revision_reason)
      setRevising(false)
      setRevisionReason('')
      setReasonError(null)
      toast.success(`Versi ${result.data.version_no ?? ''} berhasil dibuat.`)
      // Navigasi lewat useRecordTab, bukan navigate() langsung — router-nya
      // createMemoryRouter dan tab bar akan kehilangan sinkron kalau dilewati.
      openRecordTab({ label: `Anggaran v${result.data.version_no ?? ''}`, path: `/budget/submissions/${result.data.id}` })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuat revisi anggaran.'))
    }
  }

  return (
    <WorkspaceLayout
      title={submission ? `Pengajuan Anggaran — ${submission.department?.name ?? `Dept #${submission.department_id}`}` : 'Pengajuan Anggaran'}
      breadcrumb={[
        { label: 'Anggaran' },
        { label: 'Daftar Budget', path: '/budget/submissions' },
        ...(submission ? [{ label: submission.period?.name ?? `Period #${submission.budget_period_id}`, path: `/budget/periods/${submission.budget_period_id}` }] : []),
        { label: 'Pengajuan' },
      ]}
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
        )}
        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            Gagal memuat pengajuan.
          </div>
        )}

        {submission && (
          <>
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                <p className="text-[11px] text-[#64748b]">Departemen</p>
                <p className="text-[13px] font-semibold text-[#1e293b]">{submission.department?.name ?? `#${submission.department_id}`}</p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                <p className="text-[11px] text-[#64748b]">Status</p>
                <div className="mt-0.5"><BudgetStatusBadge status={submission.status} /></div>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                {/* Dua penghitung berbeda: "Versi" = versi anggaran, "Revisi ke"
                    = berapa kali pengajuan ini ditolak sebelum disetujui. */}
                <p className="text-[11px] text-[#64748b]">Versi</p>
                <p className="text-[13px] font-semibold tabular-nums text-[#1e293b]">
                  {submission.version_no ?? 1}
                  {submission.is_active && (
                    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                      Versi Aktif
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                <p className="text-[11px] text-[#64748b]">Revisi ke</p>
                <p className="text-[13px] font-semibold tabular-nums text-[#1e293b]">{submission.revision_number}</p>
              </div>
              {submission.submitted_at && (
                <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
                  <p className="text-[11px] text-[#64748b]">Diajukan</p>
                  <p className="text-[13px] font-semibold text-[#1e293b]">{formatDate(submission.submitted_at)}</p>
                </div>
              )}
            </div>

            {/* Rejection note — backend mengembalikan pengajuan yang ditolak ke
                status `draft` (dikunci test_reject_returns_to_draft_and_...),
                jadi penanda "pernah ditolak" adalah adanya rejection_note,
                bukan status 'rejected' yang tidak pernah ditulis service. */}
            {submission.status === 'draft' && submission.rejection_note && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
                <strong>Alasan penolakan:</strong> {submission.rejection_note}
                <span className="ml-2 text-red-600">(revisi ke-{submission.revision_number})</span>
              </div>
            )}

            {submission.revision_reason && (
              <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[12px] text-[#334155]">
                <strong>Alasan revisi:</strong> {submission.revision_reason}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[12px]"
                onClick={() => openRecordTab({ label: 'Riwayat Versi', path: `/budget/submissions/${submissionId}/versions` })}
              >
                Riwayat Versi
              </Button>

              {canRevise && (
                <PermissionGuard permission="budgets.revise" fallback={null}>
                  <Button size="sm" className="text-[12px]" onClick={() => setRevising((prev) => !prev)}>
                    {isRevising ? 'Batal Revisi' : 'Revisi Anggaran'}
                  </Button>
                </PermissionGuard>
              )}
            </div>

            {isRevising && canRevise && (
              <div className="space-y-2 rounded-lg border border-[#e2e8f0] bg-white p-4">
                <p className="text-[12px] text-[#64748b]">
                  Revisi membuat versi baru berstatus draf. Versi sekarang tetap tersimpan sebagai
                  riwayat dan ditandai <strong>digantikan</strong>.
                </p>
                <Textarea
                  value={revisionReason}
                  onChange={(e) => { setRevisionReason(e.target.value); setReasonError(null) }}
                  placeholder="Jelaskan apa yang berubah dan mengapa (min. 10 karakter)..."
                  rows={3}
                  className="resize-none text-[13px]"
                />
                {reasonError && <p className="text-[11px] text-red-600">{reasonError}</p>}
                <Button
                  size="sm"
                  className="text-[12px]"
                  onClick={() => void handleRevise()}
                  disabled={revise.isPending}
                >
                  {revise.isPending ? 'Membuat versi...' : 'Buat Versi Baru'}
                </Button>
              </div>
            )}

            {/* Approval actions */}
            <BudgetApprovalActions
              submission={submission}
              onActionSuccess={() => void qc.invalidateQueries({ queryKey: ['budget', 'submission', submissionId] })}
            />

            {/* Budget lines */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-[#1e293b]">Baris Anggaran</p>
              <BudgetLineEditor
                submissionId={submissionId}
                lines={submission.lines ?? []}
                readonly={!isEditable}
              />
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
