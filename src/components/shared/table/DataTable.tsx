import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { BulkActionBar, BulkAction } from './BulkActionBar'
import { TablePagination, PaginationState } from './TablePagination'

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
  return { position: 'sticky', left: meta.stickyLeft ?? 0, zIndex: 10 }
}

function headerStickyStyle(meta?: ColumnMeta): React.CSSProperties | undefined {
  if (!meta?.sticky) return undefined
  return { position: 'sticky', left: meta.stickyLeft ?? 0, zIndex: 20 }
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
  const allIds = data.map((row) => String(row.id))
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

  const isEmpty = !isLoading && data.length === 0
  const showBulkBar = !!onRowSelect && selectedRows.length > 0 && !!bulkActions?.length

  // Checkbox column injected when row selection is enabled
  const checkboxCol: ColumnDef<T> = {
    id: '_select',
    header: (
      <Checkbox
        checked={isIndeterminate ? 'indeterminate' : isAllSelected}
        onCheckedChange={toggleAll}
        aria-label="Pilih semua baris"
        disabled={isLoading || data.length === 0}
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
    <div className="flex flex-col border border-[#d9e2e5] rounded-lg overflow-hidden bg-white">
      {/* Bulk action bar */}
      {showBulkBar && (
        <BulkActionBar
          selectedCount={selectedRows.length}
          selectedIds={selectedRows}
          actions={bulkActions!}
          onClearSelection={() => onRowSelect?.([])}
        />
      )}

      {/* Table scroll container */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-[13px] border-collapse min-w-max">
          {/* Header */}
          <thead>
            <tr className="border-b border-[#d9e2e5] bg-[#f8fafc]">
              {renderedColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'text-left font-semibold text-[#24323a] px-3 py-2.5 whitespace-nowrap bg-[#f8fafc]',
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
                <tr key={rowIdx} className="border-b border-[#f1f5f9]">
                  {renderedColumns.map((col) => (
                    <td
                      key={col.id}
                      className={cn('px-3 py-2.5 bg-white', col.meta?.className)}
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
              data.map((row) => {
                const id = String(row.id)
                const isSelected = selectedRows.includes(id)

                return (
                  <tr
                    key={id}
                    className={cn(
                      'border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc]',
                      isSelected && 'bg-[#e8f4f6]',
                      isFetching && 'opacity-60',
                    )}
                  >
                    {renderedColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'px-3 py-2.5',
                          col.meta?.sticky
                            ? isSelected
                              ? 'bg-[#e8f4f6]'
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
