import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useCashPaymentList } from '../hooks/useCashBankList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { CashPayment, CashBankStatus } from '../types/cashBank.types'

const STATUSES: CashBankStatus[] = ['draft', 'posted', 'void']

export default function CashPaymentListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<CashBankStatus | undefined>()
  const { data, isLoading, isFetching } = useCashPaymentList({ page: page + 1, per_page: 25, status: filterStatus })
  const columns: ColumnDef<CashPayment>[] = [
    { id: 'number', header: 'Nomor', size: 140, meta: { sticky: true, stickyLeft: 0 }, cell: ({ original }) => <button type="button" onClick={() => navigate(`/cash-bank/cash-payments/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">{original.number}</button> },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.payment_date) },
    { id: 'account', header: 'Akun Kas/Bank', size: 180, cell: ({ original }) => original.cash_bank_account?.name ?? '-' },
    { id: 'contact', header: 'Kontak', size: 160, cell: ({ original }) => original.contact?.name ?? '-' },
    { id: 'amount', header: 'Jumlah', size: 140, meta: { className: 'tabular-nums text-right' }, cell: ({ original }) => formatCurrency(original.amount) },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]
  return (
    <WorkspaceLayout title="Pengeluaran Kas" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Pengeluaran Kas' }]}
      sidebar={<FilterSidebar activeCount={filterStatus ? 1 : 0} onReset={() => setFilterStatus(undefined)}><FilterSection title="Status">{STATUSES.map((s) => <label key={s} className="flex cursor-pointer items-center gap-2"><Checkbox checked={filterStatus === s} onCheckedChange={(c) => setFilterStatus(c ? s : undefined)} /><span className="text-[12px] capitalize text-[#334155]">{s}</span></label>)}</FilterSection></FilterSidebar>}
      action={<PermissionGuard permission="cash_bank.create"><Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/cash-bank/cash-payments/create')}><Plus className="mr-1 h-3.5 w-3.5" /> Buat Pengeluaran</Button></PermissionGuard>}>
      <DataTable data={data?.data ?? []} columns={columns} totalRows={data?.meta.total ?? 0} isLoading={isLoading} isFetching={isFetching} pagination={{ pageIndex: page, pageSize: 25 }} onPaginationChange={(p) => setPage(p.pageIndex)} emptyTitle="Belum ada pengeluaran kas" emptyDescription="Catat pengeluaran kas atau pembayaran." />
    </WorkspaceLayout>
  )
}
