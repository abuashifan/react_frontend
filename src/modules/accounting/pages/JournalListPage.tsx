import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { MultiCheckboxFilter } from '@/components/shared/filter/MultiCheckboxFilter'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { DateRangeFilterSection } from '@/components/shared/filter/DateRangeFilterSection'
import { DataTable } from '@/components/shared/table/DataTable'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useListSort } from '@/hooks/useListSort'
import { useBulkVoid } from '@/hooks/useBulkVoid'
import { useJournalEntryList, useJournalEntryMutations } from '../hooks/useJournalEntryList'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import type { JournalEntry, JournalEntryStatus } from '../types/journalEntry.types'
import { useRecordTab } from '@/hooks/useRecordTab'

const STATUSES: JournalEntryStatus[] = ['draft', 'approved', 'posted', 'void']

/**
 * Filter sumber jurnal. Default `'all'` — tanpa filter, daftar wajib
 * menampilkan seluruh jurnal, termasuk yang dibuat otomatis oleh modul lain
 * (penjualan, pembelian, persediaan, saldo awal). Menyaring jurnal sistem
 * secara diam-diam membuat sebagian besar buku besar tidak terlihat dari
 * halaman ini, jadi penyempitan itu harus jadi pilihan user yang terlihat.
 */
type JournalSourceFilter = 'all' | 'manual' | 'system'

const SOURCE_OPTIONS: { value: JournalSourceFilter; label: string }[] = [
  { value: 'manual', label: 'Jurnal manual' },
  { value: 'system', label: 'Jurnal otomatis (sistem)' },
]

function sourceToParam(source: JournalSourceFilter): boolean | undefined {
  if (source === 'manual') return false
  if (source === 'system') return true
  return undefined
}

/**
 * Total debit/kredit jurnal untuk tampilan list.
 * Prioritas: aggregate dari backend → hitung dari lines bila ada → undefined.
 * Sejak backend mengirim `total_debit`/`total_credit` (withSum di
 * `JournalEntryService::list()`), jalur aggregate yang dipakai; fallback lines
 * dipertahankan untuk pemanggil lain yang mengirim lines lengkap.
 */
function journalTotal(entry: JournalEntry, side: 'debit' | 'credit'): number | undefined {
  const aggregate = side === 'debit' ? entry.total_debit : entry.total_credit
  if (aggregate !== undefined && aggregate !== null) return aggregate
  if (Array.isArray(entry.lines) && entry.lines.length > 0) {
    return entry.lines.reduce((sum, line) => sum + (line[side] || 0), 0)
  }
  return undefined
}

export default function JournalListPage() {
  const { openRecordTab } = useRecordTab()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [prevFilters, setPrevFilters] = useState('')
  const [filterStatuses, setFilterStatuses] = useState<JournalEntryStatus[]>([])
  const [sourceFilter, setSourceFilter] = useState<JournalSourceFilter>('all')
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
  const filterKey = `${search}|${filterStatuses.join(',')}|${sourceFilter}|${dateRange.from}|${dateRange.to}|${sort?.key ?? ''}|${sort?.direction ?? ''}`
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(0)
    setSelectedRows([])
  }

  const { data, isLoading, isFetching } = useJournalEntryList({
    page: page + 1,
    per_page: 25,
    search: search || undefined,
    status: filterStatuses.length > 0 ? filterStatuses.join(',') : undefined,
    date_from: dateRange.from || undefined,
    date_to: dateRange.to || undefined,
    is_system_generated: sourceToParam(sourceFilter),
    ...sortParams,
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
  // checkbox | Tanggal | Nomor Jurnal | Deskripsi | Debit | Kredit.
  // Checkbox disuntikkan DataTable saat seleksi aktif, jadi tidak didaftarkan di sini.
  // Status tidak jadi kolom — penyaringannya lewat filter Status di sidebar.
  const columns: ColumnDef<JournalEntry>[] = [
    {
      id: 'date',
      header: 'Tanggal',
      size: 110,
      sortable: true,
      sortKey: 'journal_date',
      meta: { sticky: true, stickyLeft: 32 },
      cell: ({ original }) => formatDate(original.journal_date),
    },
    {
      id: 'number',
      header: 'Nomor Jurnal',
      size: 150,
      sortable: true,
      sortKey: 'journal_number',
      cell: ({ original }) => (
        <button type="button" onClick={() => openRecordTab({ label: original.journal_number, path: `/accounting/journals/${original.id}` })} className="font-medium text-[#5c9ead] hover:underline">
          {original.journal_number}
        </button>
      ),
    },
    // Tabel memakai `min-w-max`, jadi deskripsi panjang akan melebarkan kolom
    // tanpa batas dan mendorong Debit/Kredit keluar layar. Teksnya dipotong di
    // sel (judul lengkap tetap tersedia lewat tooltip) supaya keenam kolom muat
    // di tablet 1024px tanpa scroll horizontal.
    {
      id: 'description',
      header: 'Deskripsi',
      size: 140,
      cell: ({ original }) => (
        <span className="block max-w-[140px] truncate" title={original.description ?? undefined}>
          {original.description ?? '-'}
        </span>
      ),
    },
    {
      id: 'debit',
      header: 'Total Debit',
      size: 130,
      sortable: true,
      sortKey: 'total_debit',
      meta: { className: 'tabular-nums text-right', headerClassName: 'text-right' },
      cell: ({ original }) => formatCurrency(journalTotal(original, 'debit')),
    },
    {
      id: 'credit',
      header: 'Total Kredit',
      size: 130,
      sortable: true,
      sortKey: 'total_credit',
      meta: { className: 'tabular-nums text-right', headerClassName: 'text-right' },
      cell: ({ original }) => formatCurrency(journalTotal(original, 'credit')),
    },
  ]

  const activeFilterCount = [filterStatuses.length > 0, sourceFilter !== 'all', dateRange.from, dateRange.to].filter(Boolean).length

  const sidebar = (
    <FilterSidebar
      activeCount={activeFilterCount}
      onReset={() => {
        setFilterStatuses([])
        setSourceFilter('all')
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
      <SingleCheckboxFilter<JournalSourceFilter>
        title="Sumber"
        options={SOURCE_OPTIONS}
        value={sourceFilter}
        clearValue="all"
        note="Tanpa pilihan: semua jurnal ditampilkan, termasuk jurnal otomatis dari modul lain."
        onChange={(next) => {
          setSourceFilter(next)
          resetSelection()
        }}
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
          <PermissionGuard permission="journal.create">
            <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => openRecordTab({ label: 'Jurnal Baru', path: '/accounting/journals/create' })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Buat Jurnal
            </Button>
          </PermissionGuard>
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
