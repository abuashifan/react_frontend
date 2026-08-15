import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { usePermission } from '@/hooks/usePermission'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { budgetApi } from '../services/budgetApi'
import { BudgetStatusBadge } from '../components/BudgetStatusBadge'
import { BudgetConsolidationTable } from '../components/BudgetConsolidationTable'
import { BudgetAllocationPanel } from '../components/BudgetAllocationPanel'
import type { BudgetSubmission } from '../types/budget.types'
import type { ColumnDef, PaginationState } from '@/components/shared/table/DataTable'

type Tab = 'allocations' | 'submissions' | 'consolidation'

export default function BudgetPeriodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const periodId = Number(id)
  const { openRecordTab } = useRecordTab()
  const { can } = usePermission()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('allocations')

  const { data: periodData, isLoading: periodLoading } = useQuery({
    queryKey: ['budget', 'period', periodId],
    queryFn: () => budgetApi.getPeriod(periodId),
  })
  const period = periodData?.data

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['budget', 'submissions', periodId],
    queryFn: () => budgetApi.listSubmissions(periodId),
  })
  const submissions: BudgetSubmission[] = subsData?.data ?? []

  const [subsPagination, setSubsPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const submissionColumns: ColumnDef<BudgetSubmission>[] = [
    {
      id: 'department',
      header: 'Departemen',
      size: 220,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.department?.name ?? `Dept #${original.department_id}`,
    },
    {
      id: 'status',
      header: 'Status',
      size: 140,
      cell: ({ original }) => <BudgetStatusBadge status={original.status} />,
    },
    {
      id: 'revision_number',
      header: 'Revisi ke',
      size: 90,
      meta: { className: 'text-right tabular-nums', headerClassName: 'text-right' },
      cell: ({ original }) => original.revision_number,
    },
  ]

  const closeMut = useMutation({
    mutationFn: () => budgetApi.closePeriod(periodId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budget', 'period', periodId] }),
  })

  // Pengajuan dibuat lewat dialog, bukan halaman form: yang dibutuhkan hanya
  // departemen + catatan opsional. Memakai `Dialog` (bukan `ConfirmDialog`)
  // karena SearchableSelect berbasis Popover tidak boleh bersarang di dalam
  // AlertDialogDescription yang dirender sebagai <p>.
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [submissionNotes, setSubmissionNotes] = useState('')
  const searchDept = useCallback((q: string) => departemenApi.search(q), [])

  const closeSubmitDialog = () => {
    setSubmitDialogOpen(false)
    setDepartmentId(null)
    setSubmissionNotes('')
  }

  const createSubmissionMut = useMutation({
    mutationFn: () =>
      budgetApi.createSubmission(periodId, {
        department_id: departmentId as number,
        notes: submissionNotes.trim() || undefined,
      }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['budget', 'submissions', periodId] })
      closeSubmitDialog()
      toast.success('Pengajuan anggaran dibuat.')
      openRecordTab({
        label: res.data.department?.name ?? `Dept #${res.data.department_id}`,
        path: `/budget/submissions/${res.data.id}`,
      })
    },
    onError: (error) => {
      // 422 duplikat departemen paling sering terjadi di sini — tampilkan
      // pesan backend apa adanya, bukan teks generik.
      toast.error(getApiErrorMessage(error, 'Gagal membuat pengajuan anggaran.'))
    },
  })

  return (
    <WorkspaceLayout
      title={period?.name ?? 'Detail Pagu Anggaran'}
      breadcrumb={[{ label: 'Anggaran', path: '/budget' }, { label: 'Pagu Anggaran', path: '/budget/periods' }, { label: period?.name ?? '...' }]}
    >
      <div className="space-y-4">
        {period && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3">
            <div className="flex flex-wrap gap-4 text-[12px] text-[#64748b]">
              <span>Tahun Fiskal: <strong className="text-[#1e293b]">{period.fiscal_year}</strong></span>
              <span>Periode: <strong className="text-[#1e293b]">{formatDate(period.period_from)} — {formatDate(period.period_to)}</strong></span>
              <span>Status: <strong className={`${period.status === 'open' ? 'text-green-700' : 'text-slate-600'}`}>{period.status === 'open' ? 'Aktif' : 'Ditutup'}</strong></span>
            </div>
            {can('budgets.manage') && period.status === 'open' && (
              <Button variant="outline" size="sm" className="text-[12px] text-red-600 border-red-200 hover:bg-red-50" onClick={() => closeMut.mutate()} disabled={closeMut.isPending}>
                Tutup Periode
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-1 border-b border-[#e2e8f0]">
          {(['allocations', 'submissions', 'consolidation'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-[#5c9ead] text-[#5c9ead]' : 'border-transparent text-[#64748b] hover:text-[#334155]'}`}
            >
              {tab === 'allocations' ? 'Pagu Departemen' : tab === 'submissions' ? 'Pengajuan' : 'Konsolidasi'}
            </button>
          ))}
        </div>

        {activeTab === 'allocations' && <BudgetAllocationPanel periodId={periodId} />}

        {activeTab === 'submissions' && (
          <div className="space-y-3">
            {can('budgets.submit') && period?.status === 'open' && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setSubmitDialogOpen(true)}>Ajukan Anggaran</Button>
              </div>
            )}

            {/* Satu pengajuan per departemen per periode, jadi jumlah barisnya
                terbatas jumlah departemen — dipotong halaman di klien di atas
                koleksi lengkap dari backend, sama seperti daftar periode. */}
            <DataTable
              data={submissions.slice(
                subsPagination.pageIndex * subsPagination.pageSize,
                (subsPagination.pageIndex + 1) * subsPagination.pageSize,
              )}
              columns={submissionColumns}
              totalRows={submissions.length}
              isLoading={periodLoading || subsLoading}
              pagination={subsPagination}
              onPaginationChange={setSubsPagination}
              onRowClick={(row) =>
                openRecordTab({
                  label: row.department?.name ?? `Dept #${row.department_id}`,
                  path: `/budget/submissions/${row.id}`,
                })
              }
              emptyTitle="Belum ada pengajuan anggaran"
              emptyDescription="Klik Ajukan Anggaran untuk membuat pengajuan departemen."
            />
          </div>
        )}

        {activeTab === 'consolidation' && (
          <BudgetConsolidationTable periodId={periodId} />
        )}
      </div>

      <Dialog open={submitDialogOpen} onOpenChange={(open) => { if (!open) closeSubmitDialog() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Ajukan Anggaran</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">
              Pilih departemen yang mengajukan anggaran untuk periode ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Departemen
              </Label>
              <SearchableSelect
                value={departmentId}
                onChange={(value) => setDepartmentId(value)}
                onSearch={searchDept}
                placeholder="Cari departemen..."
                size="sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="submission-notes" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Catatan (opsional)
              </Label>
              <Textarea
                id="submission-notes"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="text-[12px]"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={closeSubmitDialog}>
              Batal
            </Button>
            <Button
              type="button"
              className="h-8 text-[13px]"
              disabled={departmentId === null || createSubmissionMut.isPending}
              onClick={() => createSubmissionMut.mutate()}
            >
              {createSubmissionMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
