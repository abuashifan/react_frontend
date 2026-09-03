import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { MultiSelectModalFilter } from '@/components/shared/filter/MultiSelectModalFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { DataTable } from '@/components/shared/table/DataTable'
import { ListExportButton, type ExportColumn } from '@/components/shared/table/ListExportButton'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useListSort } from '@/hooks/useListSort'
import { useBulkVoid } from '@/hooks/useBulkVoid'
import { useJournalEntryList, useJournalEntryMutations } from '../hooks/useJournalEntryList'
import { journalEntryApi } from '../services/journalEntryApi'
import { toExcelDate } from '@/lib/exportXlsx'
import { JOURNAL_SOURCE_TYPE_GROUPS } from '../constants/journalSourceTypes'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { JournalSourceType } from '../constants/journalSourceTypes'
import type { JournalEntry, JournalEntryStatus } from '../types/journalEntry.types'
import { useRecordTab } from '@/hooks/useRecordTab'

const STATUSES: JournalEntryStatus[] = ['draft', 'approved', 'posted', 'void']

/**
 * Nilai satu jurnal untuk tampilan list.
 *
 * Sisi debit yang dipakai, dan itu cukup mewakili: `validateBalanced()` di
 * `JournalValidationService` dijalankan saat create **dan** update, jadi tidak
 * ada jurnal tersimpan yang debit dan kreditnya berbeda. Menampilkan keduanya
 * berarti dua kolom berisi angka yang sama persis.
 *
 * Prioritas: aggregate dari backend → hitung dari lines bila ada → undefined.
 * Sejak backend mengirim `total_debit` (withSum di
 * `JournalEntryService::list()`), jalur aggregate yang dipakai; fallback lines
 * dipertahankan untuk pemanggil lain yang mengirim lines lengkap.
 */
function journalAmount(entry: JournalEntry): number | undefined {
  if (entry.total_debit !== undefined && entry.total_debit !== null) return entry.total_debit
  if (Array.isArray(entry.lines) && entry.lines.length > 0) {
    return entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  }
  return undefined
}

/**
 * Kolom file ekspor: sama dengan kolom tabel, ditambah `ID` di depan.
 * ID dibutuhkan supaya baris hasil ekspor bisa dicocokkan kembali dengan
 * record di sistem (impor balik, rekonsiliasi manual, tiket dukungan).
 */
const EXPORT_COLUMNS: ExportColumn<JournalEntry>[] = [
  { header: 'ID', value: (row) => row.id },
  { header: 'Tanggal', value: (row) => toExcelDate(row.journal_date), format: 'date' },
  { header: 'Nomor Jurnal', value: (row) => row.journal_number },
  { header: 'Deskripsi', value: (row) => row.description },
  { header: 'Nilai Jurnal', value: (row) => journalAmount(row), format: 'currency' },
  // Status tidak jadi kolom tabel (disaring lewat sidebar), tapi WAJIB ada di
  // file: tanpa itu jurnal draft dan void tidak bisa dibedakan dari yang
  // sudah diposting, dan penjumlahan di Excel akan salah tanpa disadari.
  { header: 'Status', value: (row) => row.status },
  { header: 'Jenis Jurnal', value: (row) => row.source_type },
  { header: 'Nomor Sumber', value: (row) => row.source_number },
  { header: 'Dibuat Oleh', value: (row) => row.created_by_name },
]

export default function JournalListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [prevFilters, setPrevFilters] = useState('')
  const [filterStatuses, setFilterStatuses] = useState<JournalEntryStatus[]>([])
  const [filterSourceTypes, setFilterSourceTypes] = useState<JournalSourceType[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // Sorting dilakukan server-side; nilai `key` harus cocok dengan allowlist
  // `$listSortable` di JournalEntryService.
  const { sort, toggleSort, setSort, sortParams } = useListSort({ key: 'journal_date', direction: 'desc' })

  const { void: voidJournal } = useJournalEntryMutations()

  const resetSelection = () => {
    setPage(0)
    setSelectedRows([])
  }

  // Semua filter dikirim ke server, jadi perubahannya harus mengembalikan
  // halaman ke 1 -- memfilter dari halaman jauh akan mendarat di daftar kosong.
  const filterKey = `${search}|${filterStatuses.join(',')}|${filterSourceTypes.join(',')}|${dateRange.from}|${dateRange.to}|${sort?.key ?? ''}|${sort?.direction ?? ''}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(0)
    setSelectedRows([])
  }

  // Dipisah dari page/per_page supaya tombol ekspor memakai filter DAN urutan
  // yang persis sama dengan tabel.
  const listParams = {
    search: search || undefined,
    status: filterStatuses.length > 0 ? filterStatuses.join(',') : undefined,
    source_type: filterSourceTypes.length > 0 ? filterSourceTypes.join(',') : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
    ...sortParams,
  }

  const { data, isLoading, isFetching } = useJournalEntryList({
    page: page + 1,
    per_page: 25,
    ...listParams,
  })

  const rows = useMemo(() => data?.data ?? [], [data])

  const { requestBulkVoid, dialogProps } = useBulkVoid<JournalEntry>({
    rows,
    voidRecord: (row, reason) => voidJournal.mutateAsync({ id: Number(row.id), reason }),
    // Jurnal void tidak bisa di-void ulang; jurnal sistem tidak boleh di-void
    // dari sini (harus lewat dokumen sumbernya).
    isEligible: (row) => row.status !== 'void' && !row.is_system_generated,
    getDocumentNumber: (row) => row.journal_number,
    entityLabel: 'jurnal',
    isPending: voidJournal.isPending,
    onFinished: () => setSelectedRows([]),
  })

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-void',
      label: 'Void Terpilih',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'journal.void',
      onClick: requestBulkVoid,
    },
  ]

  // Urutan kolom ditetapkan pemilik produk:
  // checkbox | Tanggal | Nomor Jurnal | Deskripsi | Nilai Jurnal | Dibuat Oleh.
  // Checkbox disuntikkan DataTable saat seleksi aktif, jadi tidak didaftarkan di sini.
  // Status tidak jadi kolom — penyaringannya lewat filter Status di sidebar.
  //
  // Anggaran lebar di tablet 1024px (sidebar filter terbuka) hanya ~754px, jadi:
  // padding sel dirapatkan ke `px-2`, dan teks bebas
  // (deskripsi, nama pembuat) dipotong di sel dengan tooltip berisi teks penuh.
  // Tabel memakai `min-w-max` sehingga tanpa pemotongan itu satu deskripsi
  // panjang saja sudah mendorong kolom nominal keluar layar.
  const columns: ColumnDef<JournalEntry>[] = [
    {
      id: 'date',
      header: 'Tanggal',
      size: 100,
      sortable: true,
      sortKey: 'journal_date',
      meta: { sticky: true, stickyLeft: 32, className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => formatDate(original.journal_date),
    },
    {
      id: 'number',
      header: 'Nomor Jurnal',
      size: 140,
      sortable: true,
      sortKey: 'journal_number',
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => (
        <button type="button" onClick={() => openRecordTab({ label: original.journal_number, path: `/accounting/journals/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
          {original.journal_number}
        </button>
      ),
    },
    {
      // Melebar dari 115px setelah Debit+Kredit jadi satu kolom: lebar yang
      // dulu dipakai kolom kedua kembali ke deskripsi, yang paling sering
      // terpotong. Pemotongan + tooltip tetap dipertahankan.
      id: 'description',
      header: 'Deskripsi',
      size: 200,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => (
        <span className="block max-w-[200px] truncate" title={original.description ?? undefined}>
          {original.description ?? '-'}
        </span>
      ),
    },
    {
      // Satu kolom nilai, bukan Debit + Kredit: jurnal selalu seimbang, jadi
      // dua kolom itu isinya identik. `sortKey` tetap `total_debit` -- alias
      // withSum yang sudah ada di allowlist `$listSortable` backend.
      id: 'amount',
      header: 'Nilai Jurnal',
      size: 130,
      sortable: true,
      sortKey: 'total_debit',
      meta: { className: 'px-2 tabular-nums text-right', headerClassName: 'px-2 text-right' },
      cell: ({ original }) => formatCurrency(journalAmount(original)),
    },
    {
      id: 'created_by',
      header: 'Dibuat Oleh',
      size: 90,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => (
        <span className="block max-w-[90px] truncate text-[#64748b]" title={original.created_by_name ?? undefined}>
          {original.created_by_name ?? '-'}
        </span>
      ),
    },
  ]

  const activeFilterCount = [filterStatuses.length > 0, filterSourceTypes.length > 0, dateRange.from, dateRange.to].filter(Boolean).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => {
        setFilterStatuses([])
        setFilterSourceTypes([])
        setDateRange({ from: '', to: '' })
        setSort({ key: 'journal_date', direction: 'desc' })
        resetSelection()
      }}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari jurnal..."
          hint="Mencari di nomor jurnal dan deskripsi."
          className="w-full max-w-none"
        />
      </div>
      <MultiCheckboxFilter
        title="Status"
        options={STATUSES.map((status) => ({ value: status, label: status }))}
        value={filterStatuses}
        onChange={(next) => {
          setFilterStatuses(next)
          resetSelection()
        }}
      />
      {/* Opsi jenis jurnal ada 21 dan akan menenggelamkan section lain kalau
          digelar inline di sidebar 220px, jadi pemilihannya lewat modal. */}
      <MultiSelectModalFilter
        title="Jenis Jurnal"
        groups={JOURNAL_SOURCE_TYPE_GROUPS}
        value={filterSourceTypes}
        onChange={(next) => {
          setFilterSourceTypes(next)
          resetSelection()
        }}
        emptyLabel="Semua jenis"
        itemNoun="jenis"
        note="Jenis diambil dari dokumen asal jurnal."
      />
      <DateRangeFilterSection
        title="Tanggal"
        from={dateRange.from}
        to={dateRange.to}
        onChange={(next) => {
          setDateRange(next)
          resetSelection()
        }}
      />
    </FilterSidebar>
  )

  return (
    <>
      <WorkspaceLayout
        title="Jurnal Umum"
        breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal Umum' }]}
        sidebar={sidebar}
        action={
          <>
            <ListExportButton
              filename="jurnal-umum"
              sheetName="Jurnal Umum"
              columns={EXPORT_COLUMNS}
              totalRows={data?.meta.total}
              fetchPage={(exportPage, exportPerPage) => journalEntryApi.list({ ...listParams, page: exportPage, per_page: exportPerPage })}
            />
            <PermissionGuard permission="journal.create">
              <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Jurnal Baru', path: '/accounting/journals/create' })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Buat Jurnal
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
          pagination={{ pageIndex: page, pageSize: 25 }}
          onPaginationChange={(p) => {
            setPage(p.pageIndex)
            setSelectedRows([])
          }}
          sort={sort}
          onSortChange={toggleSort}
          selectedRows={selectedRows}
          onRowSelect={setSelectedRows}
          bulkActions={bulkActions}
          emptyTitle="Belum ada jurnal"
          emptyDescription="Buat jurnal manual untuk mencatat transaksi akuntansi."
        />
      </WorkspaceLayout>

      <VoidConfirmDialog {...dialogProps} />
    </>
  )
}
