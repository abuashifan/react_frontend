import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { BulkActionBar } from './BulkActionBar'
import type { BulkAction } from './BulkActionBar'
import { TablePagination } from './TablePagination'
import type { PaginationState } from './TablePagination'

// Re-export so consumers import from one place
export type { PaginationState, BulkAction }

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
  emptyTitle?: string
  emptyDescription?: string
}

const SKELETON_ROWS = 5

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
  emptyTitle = 'Tidak ada data',
  emptyDescription,
}: DataTableProps<T>) {
  const rows = Array.isArray(data) ? data : []
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
  const showBulkBar = !!onRowSelect && selectedRows.length > 0 && !!bulkActions?.length

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

  const renderedColumns: ColumnDef<T>[] = onRowSelect ? [checkboxCol, ...columns] : columns

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
              {renderedColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'sticky top-0 h-9 bg-[#eeeeee] px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b] whitespace-nowrap',
                    col.meta?.headerClassName,
                  )}
                  style={{
                    ...(col.size ? { minWidth: col.size } : {}),
                    ...headerStickyStyle(col.meta),
                  }}
                >
                  {col.header}
                </th>
              ))}
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
                    className={cn(
                      'h-9 border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fbfc]',
                      isSelected && 'bg-[#EFF9FB]',
                      isFetching && 'opacity-60',
                    )}
                  >
                    {renderedColumns.map((col) => (
                      <td
                        key={col.id}
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
