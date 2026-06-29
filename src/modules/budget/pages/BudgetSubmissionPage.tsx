import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { formatDate } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'
import { BudgetStatusBadge } from '../components/BudgetStatusBadge'
import { BudgetLineEditor } from '../components/BudgetLineEditor'
import { BudgetApprovalActions } from '../components/BudgetApprovalActions'

export default function BudgetSubmissionPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number(id)
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['budget', 'submission', submissionId],
    queryFn: () => budgetApi.getSubmission(submissionId),
  })
  const submission = data?.data

  const isEditable = submission?.status === 'draft' || submission?.status === 'rejected'

  return (
    <WorkspaceLayout
      title={submission ? `Pengajuan Anggaran — ${submission.department?.name ?? `Dept #${submission.department_id}`}` : 'Pengajuan Anggaran'}
      breadcrumb={[
        { label: 'Anggaran', path: '/budget' },
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

            {/* Rejection note */}
            {submission.status === 'rejected' && submission.rejection_note && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
                <strong>Alasan penolakan:</strong> {submission.rejection_note}
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
