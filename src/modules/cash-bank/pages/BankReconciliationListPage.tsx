import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useBankReconciliationList } from '../hooks/useCashBankList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { BankReconciliation } from '../types/cashBank.types'

export default function BankReconciliationListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  // Backend hanya punya status 'draft' untuk rekonsiliasi — tidak ada filter status.
  const { data, isLoading, isFetching } = useBankReconciliationList({ page: page + 1, per_page: 25 })

  const columns: ColumnDef<BankReconciliation>[] = [
    { id: 'number', header: 'Nomor', size: 140, meta: { sticky: true, stickyLeft: 0 }, cell: ({ original }) => <button type="button" onClick={() => navigate(`/cash-bank/bank-reconciliations/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">{original.number}</button> },
    { id: 'account', header: 'Akun Bank', size: 180, cell: ({ original }) => original.cash_bank_account?.name ?? '-' },
    { id: 'start', header: 'Tgl Mulai', size: 110, cell: ({ original }) => formatDate(original.statement_start_date) },
    { id: 'end', header: 'Tgl Akhir', size: 110, cell: ({ original }) => formatDate(original.statement_end_date) },
    { id: 'ending_balance', header: 'Saldo Akhir', size: 150, meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => formatCurrency(original.statement_ending_balance) },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  return (
    <WorkspaceLayout title="Rekonsiliasi Bank" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Rekonsiliasi Bank' }]}
      action={<PermissionGuard permission="cash_bank.create"><Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/cash-bank/bank-reconciliations/create')}><Plus className="mr-1 h-3.5 w-3.5" /> Buat Rekonsiliasi</Button></PermissionGuard>}>
      <DataTable data={data?.data ?? []} columns={columns} totalRows={data?.meta.total ?? 0} isLoading={isLoading} isFetching={isFetching} pagination={{ pageIndex: page, pageSize: 25 }} onPaginationChange={(p) => setPage(p.pageIndex)} emptyTitle="Belum ada rekonsiliasi bank" emptyDescription="Rekonsiliasi saldo buku vs rekening koran." />
    </WorkspaceLayout>
  )
}
