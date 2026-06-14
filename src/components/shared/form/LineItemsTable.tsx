import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'

export interface LineItemColumn<T> {
  id: string
  header: string
  width?: number
  align?: 'left' | 'center' | 'right'
  render: (context: {
    item: T
    index: number
    isReadOnly: boolean
    onUpdate: (field: string, value: unknown) => void
  }) => React.ReactNode
}

interface LineItemsTableProps<T> {
  items: T[]
  columns: LineItemColumn<T>[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: string, value: unknown) => void
  getSubtotal?: (item: T) => number
  isReadOnly?: boolean
  addLabel?: string
  emptyLabel?: string
  currency?: string
}

/** Reusable horizontal table for transaction line items. */
export function LineItemsTable<T>({
  items,
  columns,
  onAdd,
  onRemove,
  onUpdate,
  getSubtotal,
  isReadOnly = false,
  addLabel = 'Tambah Item',
  emptyLabel = 'Belum ada item',
  currency = 'IDR',
}: LineItemsTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#eeeeee]">
              <th className="w-8 px-2 py-2 text-center text-[11px] font-bold uppercase text-[#64748b]">
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-2.5 py-2 text-[11px] font-bold uppercase text-[#64748b]',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    !column.align && 'text-left',
                  )}
                  style={column.width ? { minWidth: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
              {getSubtotal && (
                <th className="min-w-[120px] px-2.5 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">
                  Subtotal
                </th>
              )}
              <th className="w-8 px-2 py-2" aria-label="Aksi" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (getSubtotal ? 3 : 2)}
                  className="px-3 py-8 text-center text-[13px] text-[#94a3b8]"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    'group border-b border-[#f1f5f9] last:border-b-0',
                    !isReadOnly && 'hover:bg-[#f8fbfc]',
                  )}
                >
                  <td className="px-2 py-2 text-center text-[12px] text-[#94a3b8]">{index + 1}</td>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        'px-2.5 py-2 align-top',
                        column.align === 'right' && 'text-right tabular-nums',
                        column.align === 'center' && 'text-center',
                      )}
                    >
                      {column.render({
                        item,
                        index,
                        isReadOnly,
                        onUpdate: (field, value) => onUpdate(index, field, value),
                      })}
                    </td>
                  ))}
                  {getSubtotal && (
                    <td className="px-2.5 py-2 text-right font-medium tabular-nums text-[#24323a]">
                      {formatCurrency(getSubtotal(item), currency)}
                    </td>
                  )}
                  <td className="px-2 py-2 text-center">
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-[#cbd5e1] opacity-100 transition-colors hover:bg-[#fee2e2] hover:text-[#ef4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c9ead] md:opacity-0 md:group-hover:opacity-100"
                        aria-label={`Hapus item ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isReadOnly && (
        <Button
          type="button"
          variant="ghost"
          onClick={onAdd}
          className="h-10 w-full justify-start rounded-none px-3 text-[13px] font-medium text-[#5c9ead] hover:text-[#326273]"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}
