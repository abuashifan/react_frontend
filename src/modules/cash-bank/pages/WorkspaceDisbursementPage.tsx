import { useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type ColumnDef, type PaginationState } from '@/components/shared/table/DataTable'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { useAuthStore } from '@/stores/useAuthStore'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import { WorkspaceDisbursementDetail } from '../components/WorkspaceDisbursementDetail'
import { disbursementAmount, qcLabels, workspaceDisbursementApi, type QcStatus, type WorkspaceDisbursementRow } from '../services/workspaceDisbursementApi'

export default function WorkspaceDisbursementPage() {
  const companyId = useAuthStore((state) => state.activeCompanyId)
  const client = useQueryClient()
  const [selected, setSelected] = useState<number>()
  const [launcher, setLauncher] = useState<HTMLElement>()
  const [filter, setFilter] = useState<QcStatus | 'all'>('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const key = ['cash-bank', 'workspace-disbursements', companyId]
  const list = useQuery({
    queryKey: [...key, 'list', pagination, filter],
    queryFn: () => workspaceDisbursementApi.list(pagination.pageIndex + 1, pagination.pageSize, filter === 'all' ? undefined : filter),
    placeholderData: (previous, query) => query?.queryKey[2] === companyId ? keepPreviousData(previous) : undefined,
  })
  const detail = useQuery({
    queryKey: [...key, 'detail', selected],
    queryFn: () => workspaceDisbursementApi.detail(selected!),
    enabled: selected !== undefined,
  })
  const rows = list.data?.data
  const record = detail.data?.data
  const close = () => setSelected(undefined)

  const columns: ColumnDef<WorkspaceDisbursementRow>[] = [
    { id: 'title', header: 'Kegiatan', cell: ({ original }) => (
      <Button type="button" variant="link" className="h-auto whitespace-normal p-0 text-left" onClick={(event) => {
        setLauncher(event.currentTarget)
        setSelected(original.id)
      }}>{original.title}</Button>
    ) },
    { id: 'unit', header: 'Unit', size: 180, cell: ({ original }) => original.unit_name },
    { id: 'disbursed', header: 'Pencairan', size: 135, cell: ({ original }) => original.disbursed_on ? formatDate(original.disbursed_on) : 'Belum dicatat' },
    { id: 'qc', header: 'QC Accounting', size: 145, cell: ({ original }) => qcLabels[original.qc_status] },
    {
      id: 'posting', header: 'Posting', size: 145, cell: ({ original }) => original.cash_payment?.status === 'posted'
        ? 'Diposting' : original.cash_payment?.status === 'void' ? 'Dibatalkan' : '—',
    },
    { id: 'amount', header: 'Nominal', size: 145, meta: { className: 'text-right tabular-nums whitespace-nowrap', headerClassName: 'text-right' }, cell: ({ original }) => disbursementAmount(original.amount_minor) },
  ]

  return (
    <WorkspaceLayout title="Pencairan Workspace" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Pencairan Workspace' }]}
      toolbar={<div className="flex items-center gap-2 px-4 py-2">
        <label className="text-xs font-medium" htmlFor="workspace-qc-filter">Status QC</label>
        <Select value={filter} onValueChange={(value) => {
          setFilter(value as QcStatus | 'all')
          setPagination((current) => ({ ...current, pageIndex: 0 }))
        }}>
          <SelectTrigger id="workspace-qc-filter" className="h-8 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {Object.entries(qcLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>}>
      {list.error ? <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(list.error, 'Daftar pencairan gagal dimuat.')}</p> : (
        <DataTable data={rows ?? []} columns={columns} totalRows={list.data?.meta.total ?? 0}
          pagination={pagination} onPaginationChange={setPagination} isLoading={list.isLoading} isFetching={list.isFetching}
          emptyTitle="Belum ada pencairan Workspace" />
      )}
      <Dialog open={selected !== undefined} onOpenChange={(open) => { if (!open) close() }}>
        <DialogContent className="flex max-h-[calc(100dvh-96px)] w-[calc(100%-32px)] max-w-5xl flex-col gap-0 overflow-hidden p-0"
          onCloseAutoFocus={(event) => {
            if (launcher?.isConnected) { event.preventDefault(); launcher.focus() }
          }}>
          <DialogHeader className="shrink-0 border-b border-border bg-[#326273] px-4 py-3 pr-10 text-white">
            <DialogTitle className="text-sm">{record?.title ?? 'Rincian pencairan'}</DialogTitle>
            <DialogDescription className="sr-only">Pencairan dan QC untuk pengajuan Workspace.</DialogDescription>
          </DialogHeader>
          {record ? <WorkspaceDisbursementDetail key={record.id} row={record} onClose={close} onChange={(updated) => {
            client.setQueryData([...key, 'detail', updated.id], { ...detail.data, data: updated })
            void client.invalidateQueries({ queryKey: [...key, 'list'] })
            void client.invalidateQueries({ queryKey: ['cash-bank', 'payments'] })
          }} /> : (
            <p className="px-4 py-3 text-sm" role={detail.error ? 'alert' : 'status'}>
              {detail.error ? getApiErrorMessage(detail.error, 'Rincian pencairan gagal dimuat.') : 'Memuat rincian…'}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
