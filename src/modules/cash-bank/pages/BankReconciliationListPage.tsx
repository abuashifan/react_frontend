import { useState } from 'react'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useListSort } from '@/hooks/useListSort'
import { useBankReconciliationList } from '../hooks/useCashBankList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { BankReconciliation } from '../types/cashBank.types'
import { useRecordTab } from '@/hooks/useRecordTab'

export default function BankReconciliationListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(0)
  const [prevSortKey, setPrevSortKey] = useState('')

  // Sorting dilakukan server-side; nilai `key` harus cocok dengan allowlist
  // `$listSortable` di BankReconciliationService.
  const { sort, toggleSort, sortParams } = useListSort({ key: 'statement_end_date', direction: 'desc' })

  const sortKey = `${sort?.key ?? ''}|${sort?.direction ?? ''}`
  if (sortKey !== prevSortKey) {
    setPrevSortKey(sortKey)
    setPage(0)
  }

  // Backend hanya punya status 'draft' untuk rekonsiliasi — tidak ada filter status.
  const { data, isLoading, isFetching } = useBankReconciliationList({ page: page + 1, per_page: 25, ...sortParams })

  const columns: ColumnDef<BankReconciliation>[] = [
    { id: 'number', header: 'Nomor', size: 140, sortable: true, sortKey: 'reconciliation_number', meta: { sticky: true, stickyLeft: 0 }, cell: ({ original }) => <button type="button" onClick={() => openRecordTab({ label: original.number, path: `/cash-bank/bank-reconciliations/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">{original.number}</button> },
    { id: 'start', header: 'Tgl Mulai', size: 110, sortable: true, sortKey: 'statement_start_date', cell: ({ original }) => formatDate(original.statement_start_date) },
    { id: 'end', header: 'Tgl Akhir', size: 110, sortable: true, sortKey: 'statement_end_date', cell: ({ original }) => formatDate(original.statement_end_date) },
    {
      id: 'notes',
      header: 'Catatan',
      size: 200,
      cell: ({ original }) => (
        <span className="block max-w-[200px] truncate" title={original.notes ?? undefined}>
          {original.notes ?? '-'}
        </span>
      ),
    },
    { id: 'ending_balance', header: 'Saldo Akhir', size: 150, sortable: true, sortKey: 'statement_ending_balance', meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => formatCurrency(original.statement_ending_balance) },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
    {
      id: 'created_by',
      header: 'Dibuat Oleh',
      size: 90,
      cell: ({ original }) => (
        <span className="block max-w-[90px] truncate text-[#64748b]" title={original.created_by_name ?? undefined}>
          {original.created_by_name ?? '-'}
        </span>
      ),
    },
  ]

  return (
    <WorkspaceLayout title="Rekonsiliasi Bank" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Rekonsiliasi Bank' }]}
      action={<PermissionGuard permission="cash_bank.create"><Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Rekonsiliasi Baru', path: '/cash-bank/bank-reconciliations/create' })}><Plus className="mr-1 h-3.5 w-3.5" /> Buat Rekonsiliasi</Button></PermissionGuard>}>
      <DataTable data={data?.data ?? []} columns={columns} totalRows={data?.meta.total ?? 0} isLoading={isLoading} isFetching={isFetching} pagination={{ pageIndex: page, pageSize: 25 }} onPaginationChange={(p) => setPage(p.pageIndex)} sort={sort} onSortChange={toggleSort} emptyTitle="Belum ada rekonsiliasi bank" emptyDescription="Rekonsiliasi saldo buku vs rekening koran." />
    </WorkspaceLayout>
  )
}
