import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { fixedAssetCategoryApi } from '../services/fixedAssetCategoryApi'
import { useFixedAssetList } from '../hooks/useFixedAssetList'
import type { ColumnDef, PaginationState } from '@/components/shared/table/DataTable'
import type { FixedAsset, FixedAssetClass, FixedAssetStatus } from '../types/fixedAsset.types'

const STATUS_LABEL: Record<FixedAssetStatus, string> = {
  draft: 'Draft',
  capitalized: 'Dikapitalisasi',
  active: 'Aktif',
  fully_depreciated: 'Terdepresiasi',
  partially_disposed: 'Sebagian Disposal',
  disposed: 'Disposed',
}

function statusClass(status: FixedAssetStatus) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'draft') return 'border-slate-200 bg-slate-50 text-slate-700'
  if (status === 'capitalized') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === 'disposed' || status === 'partially_disposed') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function StatusBadge({ status }: { status: FixedAssetStatus }) {
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', statusClass(status))}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export default function FixedAssetListPage() {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [status, setStatus] = useState<FixedAssetStatus | ''>('')
  const [assetClass, setAssetClass] = useState<FixedAssetClass | ''>('')

  const params = useMemo(() => ({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    search,
    category_id: categoryId,
    status,
    asset_class: assetClass,
  }), [assetClass, categoryId, pagination.pageIndex, pagination.pageSize, search, status])

  const { data, isLoading, isFetching } = useFixedAssetList(params)
  const rows = data?.data ?? []

  const columns: ColumnDef<FixedAsset>[] = [
    {
      id: 'asset_number',
      header: 'Kode Aktiva',
      size: 150,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <Link className="font-semibold text-[#326273] hover:text-[#e39774]" to={`/fixed-assets/${original.id}`}>
          {original.asset_number ?? original.number ?? `FA-${original.id}`}
        </Link>
      ),
    },
    {
      id: 'name',
      header: 'Nama',
      size: 220,
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'category',
      header: 'Kategori',
      size: 170,
      cell: ({ original }) => original.category?.name ?? '-',
    },
    {
      id: 'acquisition_date',
      header: 'Tgl Perolehan',
      size: 130,
      meta: { className: 'tabular-nums' },
      cell: ({ original }) => formatDate(original.acquisition_date),
    },
    {
      id: 'acquisition_cost',
      header: 'Nilai Perolehan',
      size: 150,
      meta: { className: 'text-right tabular-nums' },
      cell: ({ original }) => formatCurrency(original.acquisition_cost),
    },
    {
      id: 'accumulated_depreciation',
      header: 'Akum Dep',
      size: 140,
      meta: { className: 'text-right tabular-nums' },
      cell: ({ original }) => formatCurrency(original.accumulated_depreciation),
    },
    {
      id: 'net_book_value',
      header: 'Nilai Buku',
      size: 140,
      meta: { className: 'text-right tabular-nums' },
      cell: ({ original }) => formatCurrency(original.net_book_value),
    },
    {
      id: 'status',
      header: 'Status',
      size: 130,
      cell: ({ original }) => <StatusBadge status={original.status} />,
    },
  ]

  const sidebar = (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Cari</Label>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama / kode..." className="h-8 text-[13px]" />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kategori</Label>
        <SearchableSelect value={categoryId} onChange={setCategoryId} onSearch={fixedAssetCategoryApi.search} placeholder="Semua kategori" size="sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</Label>
        <select value={status} onChange={(event) => setStatus(event.target.value as FixedAssetStatus | '')} className="h-8 w-full rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px] text-[#24323a]">
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kelas</Label>
        <select value={assetClass} onChange={(event) => setAssetClass(event.target.value as FixedAssetClass | '')} className="h-8 w-full rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px] text-[#24323a]">
          <option value="">Semua kelas</option>
          <option value="tangible">Tangible</option>
          <option value="intangible">Intangible</option>
        </select>
      </div>
    </div>
  )

  return (
    <WorkspaceLayout
      title="Aktiva Tetap"
      breadcrumb={[{ label: 'Aktiva Tetap' }, { label: 'Daftar Aktiva' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="fixed_assets.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/fixed-assets/create')}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Tambah Aktiva
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        data={rows}
        columns={columns}
        totalRows={data?.meta && typeof data.meta.total === 'number' ? data.meta.total : rows.length}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        emptyTitle="Belum ada aktiva tetap"
        emptyDescription="Tambah aktiva tetap atau kapitalisasi dari pembelian."
      />
    </WorkspaceLayout>
  )
}
