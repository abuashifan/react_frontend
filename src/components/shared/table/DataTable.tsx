import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { BulkActionBar } from './BulkActionBar'
import type { BulkAction } from './BulkActionBar'
import { TablePagination } from './TablePagination'
import type { PaginationState } from './TablePagination'
import type { SortState } from './tableSort'

// Re-export so consumers import from one place
export type { PaginationState, BulkAction, SortState }

export interface ColumnMeta {
  /** HP: jadikan kolom ini judul kartu (bawaan: kolom pertama). */
  mobileTitle?: boolean
  sticky?: boolean
  stickyLeft?: number
  className?: string
  headerClassName?: string
}

export interface ColumnDef<T> {
  id: string
  header: React.ReactNode
  cell: (ctx: { original: T; id: string; isSelected: boolean }) => React.ReactNode
  size?: number
  meta?: ColumnMeta
  /**
   * Aktifkan tombol sort di header kolom ini. Nama field yang dikirim ke API
   * diambil dari `sortKey`, atau `id` bila `sortKey` tidak diisi — pastikan
   * nilainya ada di allowlist `$listSortable` service backend, kalau tidak
   * backend akan mengabaikannya dan memakai urutan default.
   */
  sortable?: boolean
  sortKey?: string
}

export interface DataTableProps<T extends { id: number | string }> {
  data: T[]
  columns: ColumnDef<T>[]
  totalRows: number
  isLoading?: boolean
  isFetching?: boolean
  pagination: PaginationState
  onPaginationChange: (state: PaginationState) => void
  selectedRows?: string[]
  onRowSelect?: (ids: string[]) => void
  bulkActions?: BulkAction[]
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  /** Sort aktif; `null` = urutan default backend. Lihat `useListSort`. */
  sort?: SortState | null
  /** Dipanggil dengan `sortKey`/`id` kolom saat header sortable diklik. */
  onSortChange?: (key: string) => void
  /**
   * Di HP setiap baris tampil sebagai kartu: kolom pertama menjadi judul, kolom lain
   * pasangan label-nilai, dan kolom `actions` di kaki kartu. Isi `false` untuk tetap
   * memakai tabel.
   */
  mobileCards?: boolean
  /** Tampilkan judul kolom pertama di atas judul kartu (mis. kartu berisi isian form). */
  mobileTitleHeader?: boolean
}

const SKELETON_ROWS = 5

function SortIcon({ state }: { state: 'asc' | 'desc' | null }) {
  if (state === 'asc') return <ArrowUp className="h-3 w-3 text-[#326273]" />
  if (state === 'desc') return <ArrowDown className="h-3 w-3 text-[#326273]" />
  // Ikon netral tetap dirender (opacity rendah) supaya lebar header tidak
  // bergeser saat kolom berpindah status sort.
  return <ChevronsUpDown className="h-3 w-3 text-[#94a3b8] opacity-50 group-hover:opacity-100" />
}

function stickyStyle(meta?: ColumnMeta): React.CSSProperties | undefined {
  if (!meta?.sticky) return undefined
  return { position: 'sticky', left: meta.stickyLeft ?? 0, zIndex: 25 }
}

function headerStickyStyle(meta?: ColumnMeta): React.CSSProperties | undefined {
  if (!meta?.sticky) return undefined
  return { position: 'sticky', left: meta.stickyLeft ?? 0, zIndex: 30 }
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  totalRows,
  isLoading,
  isFetching,
  pagination,
  onPaginationChange,
  selectedRows = [],
  onRowSelect,
  bulkActions,
  onRowClick,
  emptyTitle = 'Tidak ada data',
  emptyDescription,
  sort = null,
  onSortChange,
  mobileCards = true,
  mobileTitleHeader = false,
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const rows = Array.isArray(data) ? data : []
  // Kolom checkbox cukup bergantung pada `onRowSelect`. Sebelumnya `bulkActions`
  // ikut jadi syarat, sehingga tabel yang butuh seleksi tanpa bilah aksi massal
  // (mis. dialog pemilih record) tidak bisa memakai DataTable sama sekali.
  const isSelectable = !!onRowSelect
  const allIds = rows.map((row) => String(row.id))
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedRows.includes(id))
  const isIndeterminate = selectedRows.length > 0 && !isAllSelected

  const toggleAll = () => {
    if (!onRowSelect) return
    onRowSelect(isAllSelected ? [] : allIds)
  }

  const toggleRow = (id: string) => {
    if (!onRowSelect) return
    onRowSelect(
      selectedRows.includes(id)
        ? selectedRows.filter((r) => r !== id)
        : [...selectedRows, id],
    )
  }

  const isEmpty = !isLoading && rows.length === 0
  const showBulkBar = isSelectable && selectedRows.length > 0 && !!bulkActions?.length

  // Checkbox column injected when row selection is enabled
  const checkboxCol: ColumnDef<T> = {
    id: '_select',
    header: (
      <Checkbox
        checked={isIndeterminate ? 'indeterminate' : isAllSelected}
        onCheckedChange={toggleAll}
        aria-label="Pilih semua baris"
        disabled={isLoading || rows.length === 0}
      />
    ),
    cell: ({ id }) => (
      <Checkbox
        checked={selectedRows.includes(id)}
        onCheckedChange={() => toggleRow(id)}
        aria-label={`Pilih baris ${id}`}
      />
    ),
    size: 32,
    meta: { sticky: true, stickyLeft: 0, className: 'w-8 px-2', headerClassName: 'w-8 px-2' },
  }

  const renderedColumns: ColumnDef<T>[] = isSelectable ? [checkboxCol, ...columns] : columns

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
      {/* Bulk action bar */}
      {showBulkBar && (
        <div className="flex-shrink-0 px-2 pt-2">
          <BulkActionBar
            selectedCount={selectedRows.length}
            selectedIds={selectedRows}
            actions={bulkActions!}
            onClearSelection={() => onRowSelect?.([])}
          />
        </div>
      )}

      {isMobile && mobileCards ? (
        <MobileCards
          rows={rows} columns={columns} isLoading={isLoading} isFetching={isFetching} isEmpty={isEmpty}
          emptyTitle={emptyTitle} emptyDescription={emptyDescription} onRowClick={onRowClick}
          selectedRows={selectedRows} onToggle={isSelectable ? toggleRow : undefined} titleHeader={mobileTitleHeader}
          sort={sort} onSortChange={onSortChange}
        />
      ) : (
      /* Table scroll container */
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-[13px] border-collapse min-w-max">
          {/* Header */}
          <thead>
            <tr className="border-b border-[#d9e2e5] bg-[#eeeeee]">
              {renderedColumns.map((col) => {
                const sortKey = col.sortKey ?? col.id
                const isSortable = !!col.sortable && !!onSortChange
                const sortState = sort?.key === sortKey ? sort.direction : null
                const isRightAligned = col.meta?.className?.includes('text-right')

                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={sortState ? (sortState === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'sticky top-0 h-9 bg-[#eeeeee] px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b] whitespace-nowrap',
                      col.meta?.headerClassName,
                    )}
                    style={{
                      ...(col.size ? { minWidth: col.size } : {}),
                      ...headerStickyStyle(col.meta),
                    }}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(sortKey)}
                        aria-label={typeof col.header === 'string' ? `Urutkan berdasarkan ${col.header}` : 'Urutkan kolom ini'}
                        className={cn(
                          'group -mx-1 flex w-[calc(100%+8px)] items-center gap-1 rounded px-1 py-0.5 text-[11px] font-bold uppercase',
                          'transition-colors hover:text-[#326273] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead]',
                          sortState && 'text-[#326273]',
                          isRightAligned && 'justify-end',
                        )}
                      >
                        <span className="truncate">{col.header}</span>
                        <SortIcon state={sortState} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              /* Skeleton rows */
              Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
                <tr key={rowIdx} className="h-9 border-b border-[#f1f5f9]">
                  {renderedColumns.map((col) => (
                    <td
                      key={col.id}
                      className={cn('bg-white px-3 py-2', col.meta?.className)}
                      style={stickyStyle(col.meta)}
                    >
                      <Skeleton className="h-4 w-full max-w-[140px] rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isEmpty ? (
              <tr>
                <td colSpan={renderedColumns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = String(row.id)
                const isSelected = selectedRows.includes(id)

                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'h-9 border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fbfc]',
                      isSelected && 'bg-[#EFF9FB]',
                      isFetching && 'opacity-60',
                      onRowClick && 'cursor-pointer',
                    )}
                  >
                    {renderedColumns.map((col) => (
                      <td
                        key={col.id}
                        onClick={col.id === '_select' || col.id === 'actions' ? (e) => e.stopPropagation() : undefined}
                        className={cn(
                          'px-3 py-2 text-[13px]',
                          col.meta?.sticky
                            ? isSelected
                              ? 'bg-[#EFF9FB]'
                              : 'bg-white'
                            : '',
                          col.meta?.className,
                        )}
                        style={stickyStyle(col.meta)}
                      >
                        {col.cell({ original: row, id, isSelected })}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      <TablePagination
        pagination={pagination}
        totalRows={totalRows}
        onChange={onPaginationChange}
        isFetching={isFetching || isLoading}
      />
    </div>
  )
}

function headerText(header: React.ReactNode) {
  return typeof header === 'string' || typeof header === 'number' ? String(header) : ''
}

/** Tampilan HP: satu kartu per baris. Isi sel dirender apa adanya supaya tombol dan lencana tetap berfungsi. */
function MobileCards<T extends { id: number | string }>({
  rows, columns, isLoading, isFetching, isEmpty, emptyTitle, emptyDescription, onRowClick,
  selectedRows, onToggle, titleHeader, sort, onSortChange,
}: {
  rows: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  isFetching?: boolean
  isEmpty: boolean
  emptyTitle: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  selectedRows: string[]
  onToggle?: (id: string) => void
  titleHeader?: boolean
  sort: SortState | null
  onSortChange?: (key: string) => void
}) {
  const dataColumns = columns.filter((col) => col.id !== 'actions')
  const title = dataColumns.find((col) => col.meta?.mobileTitle) ?? dataColumns[0]
  const rest = dataColumns.filter((col) => col !== title)
  const actions = columns.find((col) => col.id === 'actions')
  const sortable = columns.filter((col) => col.sortable && headerText(col.header))

  if (isLoading) {
    return (
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-2">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-md" />)}
      </div>
    )
  }
  if (isEmpty) {
    return <div className="min-h-0 flex-1 overflow-auto"><EmptyState title={emptyTitle} description={emptyDescription} /></div>
  }

  return (
    <div className={cn('min-h-0 flex-1 overflow-auto overscroll-contain', isFetching && 'opacity-60')}>
      {sortable.length > 0 && onSortChange && (
        <div className="flex items-center gap-2 border-b border-[#f1f5f9] px-3 py-2">
          <label htmlFor="mobile-sort" className="text-[12px] text-[#64748b]">Urutkan</label>
          <select
            id="mobile-sort"
            value={sort?.key ?? ''}
            onChange={(event) => { if (event.target.value) onSortChange(event.target.value) }}
            className="h-9 flex-1 rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px]"
          >
            <option value="">Urutan bawaan</option>
            {sortable.map((col) => {
              const key = col.sortKey ?? col.id
              return <option key={col.id} value={key}>{headerText(col.header)}{sort?.key === key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}</option>
            })}
          </select>
        </div>
      )}
      <ul className="divide-y divide-[#e2e8f0]">
        {rows.map((row) => {
          const id = String(row.id)
          const isSelected = selectedRows.includes(id)
          const ctx = { original: row, id, isSelected }
          return (
            <li
              key={id}
              className={cn('space-y-2 px-3 py-3', isSelected && 'bg-[#EFF9FB]', onRowClick && 'cursor-pointer active:bg-[#f8fbfc]')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              <div className="flex items-start gap-2.5">
                {onToggle && (
                  <span onClick={(event) => event.stopPropagation()} className="pt-0.5">
                    <Checkbox checked={isSelected} onCheckedChange={() => onToggle(id)} aria-label={`Pilih baris ${id}`} />
                  </span>
                )}
                {title && (
                  <div className="min-w-0 flex-1 text-[14px] font-semibold text-[#24323a] [overflow-wrap:anywhere]">
                    {headerText(title.header) && (
                      <span className={titleHeader ? 'mb-1 block text-[12px] font-normal text-[#64748b]' : 'sr-only'}>
                        {headerText(title.header)}{titleHeader ? '' : ': '}
                      </span>
                    )}
                    {title.cell(ctx)}
                  </div>
                )}
              </div>
              {rest.length > 0 && (
                <dl className={cn('grid gap-x-3 text-[13px]', titleHeader ? 'grid-cols-1 gap-y-1' : 'grid-cols-[minmax(88px,auto)_1fr] gap-y-1.5')}>
                  {rest.map((col) => (
                    <div key={col.id} className="contents">
                      <dt className="text-[12px] text-[#64748b]">{headerText(col.header)}</dt>
                      <dd className={cn('min-w-0 text-[#24323a] [overflow-wrap:anywhere]', titleHeader ? 'mb-1' : 'text-right [&_button]:ml-auto')}>{col.cell(ctx)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {actions && (
                <div className="flex flex-wrap justify-end gap-2 pt-1 [&_button]:min-h-9" onClick={(event) => event.stopPropagation()}>
                  {actions.cell(ctx)}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
