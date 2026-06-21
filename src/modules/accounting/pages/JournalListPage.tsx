import { useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useJournalEntryList } from '../hooks/useJournalEntryList'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { JournalEntry, JournalEntryStatus } from '../types/journalEntry.types'

const SOURCE_LABELS: Record<string, string> = {
  manual_journal: 'Manual',
}

function sourceLabel(entry: JournalEntry): string {
  if (entry.is_system_generated) return entry.source_type ? (SOURCE_LABELS[entry.source_type] ?? 'Sistem') : 'Sistem'
  return SOURCE_LABELS[entry.source_type ?? ''] ?? 'Manual'
}

const STATUSES: JournalEntryStatus[] = ['draft', 'approved', 'posted', 'void']

/**
 * Total debit/kredit jurnal untuk tampilan list.
 * Prioritas: aggregate dari backend → hitung dari lines bila ada → undefined.
 * Backend list saat ini tidak mengirim aggregate maupun lines, sehingga
 * formatter akan menampilkan `-` (bukan `Rp 0` palsu) sesuai spec-33.
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
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filterStatus, setFilterStatus] = useState<JournalEntryStatus | undefined>()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showSystem, setShowSystem] = useState(false)

  const query = useJournalEntryList({
    page: page + 1,
    per_page: perPage,
    search: deferredSearch || undefined,
    status: filterStatus,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    is_system_generated: showSystem ? undefined : false,
    include_void: filterStatus === 'void' ? true : undefined,
  })
  const { data, isLoading, isFetching } = query

  const columns: ColumnDef<JournalEntry>[] = [
    {
      id: 'number',
      header: 'Nomor Jurnal',
      size: 160,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => (
        <button type="button" onClick={() => navigate(`/accounting/journals/${original.id}`)} className="font-medium text-[#5c9ead] hover:underline">
          {original.journal_number}
        </button>
      ),
    },
    { id: 'date', header: 'Tanggal', size: 110, cell: ({ original }) => formatDate(original.journal_date) },
    { id: 'description', header: 'Deskripsi', size: 220, cell: ({ original }) => original.description ?? '-' },
    {
      id: 'debit',
      header: 'Total Debit',
      size: 140,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(journalTotal(original, 'debit')),
    },
    {
      id: 'credit',
      header: 'Total Kredit',
      size: 140,
      meta: { className: 'tabular-nums text-right' },
      cell: ({ original }) => formatCurrency(journalTotal(original, 'credit')),
    },
    { id: 'source', header: 'Sumber', size: 100, cell: ({ original }) => sourceLabel(original) },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <DocumentStatusBadge status={original.status} /> },
  ]

  const activeFilterCount = [filterStatus, dateFrom, dateTo, showSystem || undefined].filter(Boolean).length

  const sidebar = (
    <FilterSidebar activeCount={activeFilterCount} onReset={() => { setFilterStatus(undefined); setDateFrom(''); setDateTo(''); setShowSystem(false) }}>
      <FilterSection title="Sumber">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox checked={showSystem} onCheckedChange={(c) => { setShowSystem(!!c); setPage(0) }} />
          <span className="text-[12px] text-[#334155]">Tampilkan jurnal sistem</span>
        </label>
      </FilterSection>
      <FilterSection title="Tanggal">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#64748b]">Dari</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-[12px]" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#64748b]">Sampai</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-[12px]" />
        </div>
      </FilterSection>
      <FilterSection title="Status">
        {STATUSES.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={filterStatus === s} onCheckedChange={(c) => setFilterStatus(c ? s : undefined)} />
            <span className="text-[12px] capitalize text-[#334155]">{s}</span>
          </label>
        ))}
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Jurnal Umum"
      breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal Umum' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="journal.create">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={() => navigate('/accounting/journals/create')}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Buat Jurnal
          </Button>
        </PermissionGuard>
      }
    >
      <div className="relative mb-3 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
        <Input
          type="search"
          role="searchbox"
          aria-label="Cari nomor atau deskripsi jurnal"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Cari nomor atau deskripsi jurnal..."
          className="h-9 pl-8 text-[13px]"
        />
      </div>
      {query.isError ? (
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Jurnal gagal dimuat" />
      ) : (
        <DataTable
          data={data?.data ?? []}
          columns={columns}
          totalRows={data?.meta.total ?? 0}
          isLoading={isLoading}
          isFetching={isFetching}
          pagination={{ pageIndex: page, pageSize: perPage }}
          onPaginationChange={(p) => { setPage(p.pageIndex); setPerPage(p.pageSize as 25 | 50 | 100) }}
          emptyTitle="Belum ada jurnal"
          emptyDescription="Buat jurnal manual untuk mencatat transaksi akuntansi."
        />
      )}
    </WorkspaceLayout>
  )
}
