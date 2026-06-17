import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { isDateInRange } from '@/components/shared/filter/dateRangeUtils'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useGoodsReceiptList, useGoodsReceiptMutations } from '../hooks/useGoodsReceiptList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { GoodsReceipt, GoodsReceiptStatus } from '../types/goodsReceipt.types'

const STATUSES: GoodsReceiptStatus[] = ['draft', 'received', 'partially_billed', 'void', 'cancelled']
const FILTER_HINT = 'Filter multi-select dan tanggal berlaku pada data halaman yang sedang dimuat.'

export default function GoodsReceiptListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const [filterStatuses, setFilterStatuses] = useState<GoodsReceiptStatus[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [filterVendor, setFilterVendor] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [bulkVoidIds, setBulkVoidIds] = useState<string[]>([])
  const [isBulkVoidOpen, setBulkVoidOpen] = useState(false)
  const { void: voidGoodsReceipt } = useGoodsReceiptMutations()

  const { data, isLoading, isFetching } = useGoodsReceiptList({
    page: page + 1,
    per_page: 25,
    vendor_id: filterVendor ?? undefined,
  })

  const rows = data?.data ?? []
  const visibleRows = useMemo(
    () =>
      rows.filter((goodsReceipt) => {
        const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(goodsReceipt.status)
        const matchesDate = isDateInRange(goodsReceipt.date, dateRange.from, dateRange.to)
        return matchesStatus && matchesDate
      }),
    [rows, filterStatuses, dateRange.from, dateRange.to],
  )

  const activeFilters = [filterStatuses.length > 0, dateRange.from, dateRange.to, filterVendor].filter(Boolean).length

  const resetSelection = () => {
    setPage(0)
    setSelectedRows([])
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-void',
      label: 'Void Terpilih',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'purchase.goods-receipts.void',
      onClick: (ids) => {
        const eligible = visibleRows.filter((goodsReceipt) => ids.includes(String(goodsReceipt.id)) && goodsReceipt.status !== 'void')
        if (eligible.length === 0) {
          toast.warning('Dokumen yang dipilih tidak bisa di-void.')
          return
        }
        setBulkVoidIds(eligible.map((goodsReceipt) => String(goodsReceipt.id)))
        setBulkVoidOpen(true)
      },
    },
  ]

  const handleBulkVoid = async (reason: string) => {
    const selectedGoodsReceipts = visibleRows.filter((goodsReceipt) => bulkVoidIds.includes(String(goodsReceipt.id)))
    if (selectedGoodsReceipts.length === 0) {
      toast.warning('Tidak ada penerimaan barang valid untuk di-void.')
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      return
    }

    try {
      const results = await Promise.allSettled(selectedGoodsReceipts.map((goodsReceipt) => voidGoodsReceipt.mutateAsync({ id: Number(goodsReceipt.id), reason })))
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount === 0) {
        toast.success(`${successCount} penerimaan barang berhasil di-void.`)
      } else if (successCount === 0) {
        toast.error(`Gagal void ${failureCount} penerimaan barang.`)
      } else {
        toast.warning(`${successCount} penerimaan barang berhasil di-void, ${failureCount} gagal.`)
      }
    } catch {
      toast.error('Gagal memproses bulk void.')
    } finally {
      setBulkVoidOpen(false)
      setBulkVoidIds([])
      setSelectedRows([])
    }
  }

  const columns: ColumnDef<GoodsReceipt>[] = [
    {
      id: 'number',
      header: 'Nomor GR',
      size: 140,
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/purchase/goods-receipts/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.number}
        </button>
      ),
    },
    { id: 'po', header: 'Nomor PO', size: 130, cell: ({ original }) => original.purchase_order_number ?? '-' },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.date) },
    { id: 'vendor', header: 'Vendor', size: 200, cell: ({ original }) => original.vendor?.name ?? '-' },
    { id: 'warehouse', header: 'Gudang', size: 150, cell: ({ original }) => original.warehouse?.name ?? '-' },
    { id: 'status', header: 'Status', size: 120, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilters}
      onReset={() => {
        setFilterStatuses([])
        setDateRange({ from: '', to: '' })
        setFilterVendor(null)
        resetSelection()
      }}
      hint={FILTER_HINT}
    >
      <MultiCheckboxFilter
        title="Status"
        options={STATUSES.map((status) => ({ value: status, label: status.replace('_', ' ') }))}
        value={filterStatuses}
        onChange={(next) => {
          setFilterStatuses(next)
          resetSelection()
        }}
      />
      <DateRangeFilterSection
        from={dateRange.from}
        to={dateRange.to}
        onChange={(next) => {
          setDateRange(next)
          resetSelection()
        }}
        note="Berlaku pada data halaman yang sedang dimuat."
      />
      <FilterSection title="Vendor">
        <SearchableSelect
          value={filterVendor}
          onChange={(v) => {
            setFilterVendor(v)
            resetSelection()
          }}
          onSearch={(q) => kontakApi.search(q, 'supplier')}
          placeholder="Semua vendor"
        />
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <>
      <WorkspaceLayout
        title="Penerimaan Barang"
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Penerimaan Barang' }]}
        sidebar={sidebar}
        action={
          <PermissionGuard permission="purchase.goods-receipts.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/purchase/goods-receipts/create')}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat GR
            </Button>
          </PermissionGuard>
        }
      >
        <DataTable
          data={visibleRows}
          columns={columns}
          totalRows={data?.meta.total ?? 0}
          isLoading={isLoading}
          isFetching={isFetching}
          pagination={{ pageIndex: page, pageSize: 25 }}
          onPaginationChange={(p) => {
            setPage(p.pageIndex)
            setSelectedRows([])
          }}
          selectedRows={selectedRows}
          onRowSelect={setSelectedRows}
          bulkActions={bulkActions}
          emptyTitle="Belum ada penerimaan barang"
          emptyDescription="Buat GR dari Purchase Order yang sudah dikonfirmasi."
        />
      </WorkspaceLayout>

      <VoidConfirmDialog
        isOpen={isBulkVoidOpen}
        onClose={() => {
          setBulkVoidOpen(false)
          setBulkVoidIds([])
          setSelectedRows([])
        }}
        onConfirm={(reason) => void handleBulkVoid(reason)}
        documentNumber={
          bulkVoidIds.length === 1
            ? (visibleRows.find((row) => String(row.id) === bulkVoidIds[0])?.number ?? '1 dokumen terpilih')
            : `${bulkVoidIds.length} dokumen terpilih`
        }
        isLoading={voidGoodsReceipt.isPending}
      />
    </>
  )
}
