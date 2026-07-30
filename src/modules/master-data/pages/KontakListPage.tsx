import { useState } from 'react'
import { Plus, PowerOff } from 'lucide-react'
import { useRecordTab } from '@/hooks/useRecordTab'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { useKontakList, useKontakMutations } from '../hooks/useKontakList'
import type { Kontak, KontakType } from '../types/kontak.types'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'

const KONTAK_TYPE_LABELS: Record<KontakType, string> = {
  customer: 'Customer',
  supplier: 'Supplier',
  both: 'Keduanya',
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
        {KONTAK_TYPE_LABELS[original.contact_type]}
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
    cell: ({ original }) => (
      <Badge
        className={cn(
          'text-[11px] px-2 py-0.5 rounded-full',
          original.is_active
            ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]'
            : 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
        )}
      >
        {original.is_active ? 'Aktif' : 'Nonaktif'}
      </Badge>
    ),
  },
]

export default function KontakListPage() {
  const { openRecordTab } = useRecordTab()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [filterType, setFilterType] = useState<KontakType | undefined>()
  const [filterActive, setFilterActive] = useState<boolean | undefined>()
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const { data, isLoading, isFetching } = useKontakList({
    page,
    per_page: perPage,
    contact_type: filterType,
    is_active: filterActive,
  })
  const { deactivate } = useKontakMutations()

  const activeFilterCount = [filterType, filterActive].filter((v) => v !== undefined).length

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-deactivate',
      label: 'Nonaktifkan Terpilih',
      icon: <PowerOff className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'contacts.deactivate',
      onClick: async (ids) => {
        const rows = data?.data ?? []
        const eligible = rows.filter((k) => ids.includes(String(k.id)) && k.is_active)
        if (eligible.length === 0) {
          toast.warning('Kontak yang dipilih sudah nonaktif.')
          return
        }
        if (!confirm(`Nonaktifkan ${eligible.length} kontak terpilih?`)) return

        const results = await Promise.allSettled(eligible.map((k) => deactivate.mutateAsync(k.id)))
        const successCount = results.filter((r) => r.status === 'fulfilled').length
        const failureCount = results.length - successCount

        if (failureCount === 0) {
          toast.success(`${successCount} kontak berhasil dinonaktifkan.`)
        } else if (successCount === 0) {
          toast.error(`Gagal menonaktifkan ${failureCount} kontak.`)
        } else {
          toast.warning(`${successCount} kontak dinonaktifkan, ${failureCount} gagal.`)
        }
        setSelectedRows([])
      },
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterType(undefined); setFilterActive(undefined) }}
    >
      <FilterSection title="Tipe Kontak">
        {(['customer', 'supplier', 'both'] as KontakType[]).map((t) => (
          <label key={t} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filterType === t}
              onCheckedChange={(checked) => setFilterType(checked ? t : undefined)}
            />
            <span className="text-[12px] text-[#334155]">{KONTAK_TYPE_LABELS[t]}</span>
          </label>
        ))}
      </FilterSection>
      <FilterSection title="Status">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filterActive === true}
            onCheckedChange={(checked) => setFilterActive(checked ? true : undefined)}
          />
          <span className="text-[12px] text-[#334155]">Aktif</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filterActive === false}
            onCheckedChange={(checked) => setFilterActive(checked ? false : undefined)}
          />
          <span className="text-[12px] text-[#334155]">Nonaktif</span>
        </label>
      </FilterSection>
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
