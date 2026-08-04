import { useState } from 'react'
import { Plus, Power, PowerOff } from 'lucide-react'
import { useRecordTab } from '@/hooks/useRecordTab'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActiveStatusBadge } from '@/components/shared/badge/ActiveStatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { useKontakList, useKontakMutations } from '../hooks/useKontakList'
import type { Kontak, KontakType } from '../types/kontak.types'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'

const STATUS_OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: true, label: 'Aktif' },
  { value: false, label: 'Nonaktif' },
  { value: undefined, label: 'Semua' },
]

const KONTAK_TYPE_LABELS: Record<KontakType, string> = {
  customer: 'Customer',
  supplier: 'Supplier',
  both: 'Keduanya',
}

/** Tipe kontak ditentukan dari flag is_customer/is_supplier — `contact_type` mentah backend
 * bukan sumber kebenaran (lihat KontakType di kontak.types.ts). */
function getKontakTypeLabel(kontak: Kontak): string {
  if (kontak.is_customer && kontak.is_supplier) return KONTAK_TYPE_LABELS.both
  if (kontak.is_customer) return KONTAK_TYPE_LABELS.customer
  if (kontak.is_supplier) return KONTAK_TYPE_LABELS.supplier
  // Fallback untuk data lama yang belum punya flag is_customer/is_supplier
  if (kontak.contact_type === 'customer' || kontak.contact_type === 'supplier') {
    return KONTAK_TYPE_LABELS[kontak.contact_type]
  }
  return '-'
}

const columns: ColumnDef<Kontak>[] = [
  {
    id: 'contact_code',
    header: 'Kode',
    size: 100,
    meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
    cell: ({ original }) => original.contact_code ?? '-',
  },
  {
    id: 'name',
    header: 'Nama',
    size: 200,
    cell: ({ original }) => original.name,
  },
  {
    id: 'contact_type',
    header: 'Tipe',
    size: 110,
    cell: ({ original }) => (
      <Badge className="text-[11px] bg-[#EFF9FB] text-[#326273] hover:bg-[#EFF9FB]">
        {getKontakTypeLabel(original)}
      </Badge>
    ),
  },
  {
    id: 'phone',
    header: 'Telepon',
    size: 130,
    cell: ({ original }) => original.phone ?? '-',
  },
  {
    id: 'email',
    header: 'Email',
    size: 180,
    cell: ({ original }) => original.email ?? '-',
  },
  {
    id: 'is_active',
    header: 'Status',
    size: 90,
    cell: ({ original }) => <ActiveStatusBadge isActive={original.is_active} />,
  },
]

export default function KontakListPage() {
  const { openRecordTab } = useRecordTab()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [filterType, setFilterType] = useState<KontakType | undefined>()
  // Default: hanya tampilkan kontak aktif. Pilih "Semua" di filter Status untuk menampilkan semuanya.
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [prevSearch, setPrevSearch] = useState('')
  const { data, isLoading, isFetching } = useKontakList({
    page,
    per_page: perPage,
    is_customer: filterType === 'customer' || filterType === 'both' ? true : undefined,
    is_supplier: filterType === 'supplier' || filterType === 'both' ? true : undefined,
    is_active: filterActive,
    search: search || undefined,
  })

  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }
  const { activate, deactivate } = useKontakMutations()

  const activeFilterCount = [filterType, filterActive].filter((v) => v !== undefined).length

  const runBulkStatusChange = async (
    ids: string[],
    targetActive: boolean,
    mutateAsync: (id: number) => Promise<unknown>,
  ) => {
    const rows = data?.data ?? []
    const eligible = rows.filter((k) => ids.includes(String(k.id)) && k.is_active !== targetActive)
    const verb = targetActive ? 'diaktifkan' : 'dinonaktifkan'
    if (eligible.length === 0) {
      toast.warning(`Kontak yang dipilih sudah ${verb}.`)
      return
    }
    if (!targetActive && !confirm(`Nonaktifkan ${eligible.length} kontak terpilih?`)) return

    const results = await Promise.allSettled(eligible.map((k) => mutateAsync(k.id)))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.length - successCount

    if (failureCount === 0) {
      toast.success(`${successCount} kontak berhasil ${verb}.`)
    } else if (successCount === 0) {
      toast.error(`Gagal ${targetActive ? 'mengaktifkan' : 'menonaktifkan'} ${failureCount} kontak.`)
    } else {
      toast.warning(`${successCount} kontak ${verb}, ${failureCount} gagal.`)
    }
    setSelectedRows([])
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-activate',
      label: 'Aktifkan Terpilih',
      icon: <Power className="h-3.5 w-3.5" />,
      permission: 'contacts.edit',
      onClick: (ids) => runBulkStatusChange(ids, true, (id) => activate.mutateAsync(id)),
    },
    {
      id: 'bulk-deactivate',
      label: 'Nonaktifkan Terpilih',
      icon: <PowerOff className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'contacts.deactivate',
      onClick: (ids) => runBulkStatusChange(ids, false, (id) => deactivate.mutateAsync(id)),
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterType(undefined); setFilterActive(true) }}
    >
      <SingleCheckboxFilter
        title="Tipe Kontak"
        options={(['customer', 'supplier', 'both'] as KontakType[]).map((t) => ({ value: t, label: KONTAK_TYPE_LABELS[t] }))}
        value={filterType}
        onChange={setFilterType}
      />
      <SingleCheckboxFilter
        title="Status"
        options={STATUS_OPTIONS}
        value={filterActive}
        onChange={setFilterActive}
      />
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Kontak"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Kontak' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="master-data.contacts.create">
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
            onClick={() => openRecordTab({ label: 'Kontak Baru', path: '/master-data/contacts/create' })}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kontak
          </Button>
        </PermissionGuard>
      }
    >
      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari kode, nama, telepon, atau email kontak..."
        className="mb-3"
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(s) => { setPage(s.pageIndex + 1); setPerPage(s.pageSize) }}
        selectedRows={selectedRows}
        onRowSelect={setSelectedRows}
        bulkActions={bulkActions}
        onRowClick={(row) => openRecordTab({ label: row.name, path: `/master-data/contacts/${row.id}` })}
        emptyTitle="Belum ada kontak"
        emptyDescription="Tambahkan customer atau supplier pertama untuk memulai."
      />
    </WorkspaceLayout>
  )
}
