import { useState } from 'react'
import { Plus, Power, PowerOff } from 'lucide-react'
import { useRecordTab } from '@/hooks/useRecordTab'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { ListExportButton, type ExportColumn } from '@/components/shared/table/ListExportButton'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActiveStatusBadge } from '@/components/shared/badge/ActiveStatusBadge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { getBulkFailureDetail } from '@/lib/apiError'
import { useCoaList, useCoaMutations } from '../hooks/useCoaList'
import { coaApi } from '../services/coaApi'
import type { Coa, CoaType } from '../types/coa.types'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'

const COA_TYPE_LABELS: Record<CoaType, string> = {
  asset: 'Aset',
  liability: 'Liabilitas',
  equity: 'Ekuitas',
  revenue: 'Pendapatan',
  expense: 'Beban',
}

const STATUS_OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: true, label: 'Aktif' },
  { value: false, label: 'Nonaktif' },
  { value: undefined, label: 'Semua' },
]

/**
 * Kolom file ekspor: sama dengan kolom tabel, ditambah `ID` di depan.
 * ID dibutuhkan supaya baris hasil ekspor bisa dicocokkan kembali dengan
 * record di sistem (impor balik, rekonsiliasi manual, tiket dukungan).
 */
const EXPORT_COLUMNS: ExportColumn<Coa>[] = [
  { header: 'ID', value: (row) => row.id },
  { header: 'Kode', value: (row) => row.account_code },
  { header: 'Nama Akun', value: (row) => row.account_name },
  { header: 'Tipe', value: (row) => COA_TYPE_LABELS[row.account_type] ?? row.account_type },
  { header: 'Status', value: (row) => (row.is_active ? 'Aktif' : 'Nonaktif') },
]

export default function CoaListPage() {
  const { openRecordTab } = useRecordTab()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [filterType, setFilterType] = useState<CoaType | undefined>()
  // Default: hanya tampilkan akun aktif. Pilih "Semua" di filter Status untuk menampilkan semuanya.
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')

  // `postable_only` menyembunyikan akun induk (header kategori seperti
  // "AKTIVA LANCAR"/"ASET TETAP") -- akun-akun itu cuma rangkuman saldo di
  // laporan dan tidak bisa dipakai transaksi, jadi tidak ada gunanya di
  // daftar kerja sehari-hari. Konsekuensinya daftar ini rata (bukan
  // hierarkis lagi): tanpa induknya tampil, indentasi per-`depth` cuma
  // membuat kode akun menjorok acak tanpa induk yang terlihat -- makanya
  // kolom Kode di bawah TIDAK diberi padding indentasi lagi.
  // Dipisah dari page/per_page supaya tombol ekspor bisa memakai filter yang
  // PERSIS sama dengan tabel -- termasuk `is_active`, jadi akun nonaktif ikut
  // terekspor hanya kalau memang sedang ditampilkan.
  const listParams = {
    account_type: filterType,
    is_active: filterActive,
    search: search || undefined,
    postable_only: true,
  }

  const { data, isLoading, isFetching } = useCoaList({
    page,
    per_page: perPage,
    ...listParams,
  })

  // Kembali ke halaman 1 saat filter berubah, supaya tidak mendarat di halaman
  // kosong setelah hasilnya menyusut. Seleksi juga dikosongkan — aksi massal
  // tidak boleh mengenai baris yang sudah tidak terlihat.
  const [prevFilters, setPrevFilters] = useState('')
  const filterKey = `${search}|${String(filterType)}|${String(filterActive)}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(1)
    setSelectedIds([])
  }

  const { activate, deactivate } = useCoaMutations()

  const rows = data?.data ?? []

  /**
   * Jalankan aksi massal per akun terpilih.
   *
   * Pakai `allSettled` (bukan loop `await` berurutan) supaya satu akun yang gagal
   * — mis. akun induk yang masih punya sub-akun aktif — tidak menghentikan sisanya
   * tanpa kabar apa pun ke user.
   */
  const runBulkStatusChange = async (
    ids: string[],
    targetActive: boolean,
    mutateAsync: (id: number) => Promise<unknown>,
  ) => {
    const eligible = rows.filter((r) => ids.includes(String(r.id)) && r.is_active !== targetActive)
    const verb = targetActive ? 'diaktifkan' : 'dinonaktifkan'
    if (eligible.length === 0) {
      toast.warning(`Akun yang dipilih sudah ${verb}.`)
      return
    }
    if (!targetActive && !confirm(`Nonaktifkan ${eligible.length} akun terpilih?`)) return

    const results = await Promise.allSettled(eligible.map((r) => mutateAsync(r.id)))
    const successCount = results.filter((result) => result.status === 'fulfilled').length
    const failureCount = results.length - successCount
    const failureDetail = getBulkFailureDetail(results)

    if (failureCount === 0) {
      toast.success(`${successCount} akun ${verb}.`)
    } else if (successCount === 0) {
      // mis. ACCOUNT_HAS_ACTIVE_CHILDREN saat menonaktifkan akun induk.
      toast.error(`Gagal ${targetActive ? 'mengaktifkan' : 'menonaktifkan'} ${failureCount} akun.${failureDetail ? ` ${failureDetail}` : ''}`)
    } else {
      toast.warning(`${successCount} akun ${verb}, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
    }
    setSelectedIds([])
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-activate',
      label: 'Aktifkan Terpilih',
      icon: <Power className="h-3.5 w-3.5" />,
      permission: 'coa.edit',
      onClick: (ids) => runBulkStatusChange(ids, true, (id) => activate.mutateAsync(id)),
    },
    {
      id: 'bulk-deactivate',
      label: 'Nonaktifkan Terpilih',
      icon: <PowerOff className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'coa.deactivate',
      onClick: (ids) => runBulkStatusChange(ids, false, (id) => deactivate.mutateAsync(id)),
    },
  ]

  const columns: ColumnDef<Coa>[] = [
    {
      id: 'account_code',
      header: 'Kode',
      size: 180,
      meta: { sticky: true, stickyLeft: 32, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.account_code,
    },
    {
      id: 'account_name',
      header: 'Nama Akun',
      size: 220,
      cell: ({ original }) => original.account_name,
    },
    {
      id: 'account_type',
      header: 'Tipe',
      size: 130,
      cell: ({ original }) => COA_TYPE_LABELS[original.account_type],
    },
    {
      id: 'is_active',
      header: 'Status',
      size: 100,
      cell: ({ original }) => <ActiveStatusBadge isActive={original.is_active} />,
    },
  ]

  const activeFilterCount = [filterType, filterActive].filter((v) => v !== undefined).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => { setFilterType(undefined); setFilterActive(true) }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari kode atau nama akun..."
          className="w-full max-w-none"
        />
      </div>
      <SingleCheckboxFilter
        title="Tipe Akun"
        options={(['asset', 'liability', 'equity', 'revenue', 'expense'] as CoaType[]).map((t) => ({ value: t, label: COA_TYPE_LABELS[t] }))}
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
      title="Chart of Accounts"
      breadcrumb={[{ label: 'Master Data' }, { label: 'COA' }]}
      sidebar={sidebar}
      action={
        <>
          <ListExportButton
            filename="coa"
            sheetName="Chart of Accounts"
            columns={EXPORT_COLUMNS}
            totalRows={data?.meta.total}
            fetchPage={(exportPage, exportPerPage) => coaApi.list({ ...listParams, page: exportPage, per_page: exportPerPage })}
          />
          <PermissionGuard permission="master-data.coa.create">
            <Button
              className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
              onClick={() => openRecordTab({ label: 'Akun Baru', path: '/master-data/coa/create' })}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Akun
            </Button>
          </PermissionGuard>
        </>
      }
    >
      <DataTable
        data={rows}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(s) => {
          setPage(s.pageIndex + 1)
          setPerPage(s.pageSize)
          setSelectedIds([])
        }}
        selectedRows={selectedIds}
        onRowSelect={setSelectedIds}
        bulkActions={bulkActions}
        onRowClick={(row) => openRecordTab({ label: row.account_code, path: `/master-data/coa/${row.id}` })}
        emptyTitle="Belum ada akun"
        emptyDescription='Klik "Tambah Akun" untuk memulai.'
      />
    </WorkspaceLayout>
  )
}
