import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { BulkActionBar } from './BulkActionBar'
import type { BulkAction } from './BulkActionBar'
import { TablePagination } from './TablePagination'
import type { PaginationState } from './TablePagination'
import type { SortState } from './tableSort'

// Re-export so consumers import from one place
export type { PaginationState, BulkAction, SortState }

export interface ColumnMeta {
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
}: DataTableProps<T>) {
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

      {/* Table scroll container */}
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
                        onClick={col.id === '_select' ? (e) => e.stopPropagation() : undefined}
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
