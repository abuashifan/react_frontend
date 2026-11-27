import { Fragment } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { LineItemErrorMap } from '@/lib/apiError'

/**
 * Cocokkan nama field dari backend dengan kolom tabel.
 *
 * `column.id` tidak selalu sama persis dengan nama field backend — mis. kolom
 * `product` untuk field `product_id`, atau kolom `discount` untuk
 * `discount_value`. Pencocokan dibuat toleran supaya sel yang benar ikut ditandai;
 * kalau tetap tidak ketemu, pesannya tetap tampil sebagai pesan baris.
 */
function fieldMatchesColumn(field: string, columnId: string): boolean {
  return field === columnId || field.startsWith(`${columnId}_`) || columnId.startsWith(`${field}_`)
}

/**
 * Style input "flush" untuk kontrol di dalam sel tabel `bordered` — tanpa
 * border/rounded sendiri, sehingga barisnya terbaca sebagai satu grid
 * spreadsheet alih-alih deretan kotak input yang saling bertumpuk bordernya.
 *
 * Tinggal di sini (bukan di tiap halaman) supaya semua form line item memakai
 * definisi yang sama; sebelumnya konstanta ini disalin per halaman dan mulai
 * lepas sinkron.
 */
export const FLUSH_INPUT_CLASS =
  'rounded-none border-0 bg-transparent px-2 focus:shadow-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5c9ead]/40'

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
  /**
   * Tombol "+ Tambah Item" bawaan. Kalau tidak diisi, tombolnya tidak dirender
   * sama sekali — dipakai form yang menambah baris dari kontrol lain (mis.
   * `SearchableSelect` di atas tabel), sehingga barisnya datang sudah terisi
   * data alih-alih kosong.
   */
  onAdd?: () => void
  onRemove?: (index: number) => void
  onUpdate?: (index: number, field: string, value: unknown) => void
  getSubtotal?: (item: T) => number
  isReadOnly?: boolean
  addLabel?: string
  emptyLabel?: string
  currency?: string
  /**
   * Error per baris dari backend (lihat `getApiLineErrors`). Baris yang punya
   * error ditandai merah dan pesannya ditampilkan di bawah baris tersebut.
   */
  errors?: LineItemErrorMap
  /**
   * Garis pembatas vertikal antar kolom, sehingga tabel terbaca sebagai satu
   * grid spreadsheet alih-alih deretan kotak input yang masing-masing punya
   * border/rounded sendiri.
   *
   * DEFAULT `true`. Gaya ini dulunya opt-in per halaman, dan akibatnya dua form
   * sejenis yang memakai komponen yang sama (Penerimaan Kas vs Pengeluaran Kas)
   * tampil berbeda — yang satu ikut, yang lain lupa. Sekarang komponen yang
   * memutuskan tampilan, bukan tiap pemanggil.
   *
   * Kontrol di dalam sel wajib memakai `FLUSH_INPUT_CLASS` (atau prop `flush`
   * untuk `SearchableSelect`) — tanpa itu border sel dan border input bertumpuk.
   */
  bordered?: boolean
  /**
   * Baris ringkasan opsional di bawah baris terakhir (mis. Total). Callback
   * mengembalikan satu atau beberapa `<tr>`; komponen hanya menyediakan
   * `<tfoot>` beserta garis pemisahnya — isinya sepenuhnya milik pemanggil,
   * sama seperti `column.render`.
   *
   * `cellCount` adalah jumlah sel per baris (kolom `#`, semua kolom data,
   * Subtotal bila ada, dan kolom aksi) supaya `colSpan` bisa dihitung tanpa
   * menebak jumlah kolom internal.
   */
  footer?: (items: T[], cellCount: number) => React.ReactNode
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
  errors,
  bordered = true,
  footer,
}: LineItemsTableProps<T>) {
  const isMobile = useIsMobile()
  const columnCount = columns.length + 1 + Number(Boolean(getSubtotal)) + Number(Boolean(onRemove))
  if (isMobile) {
    return (
      <MobileLineItems
        items={items} columns={columns} onAdd={onAdd} onRemove={onRemove} onUpdate={onUpdate} getSubtotal={getSubtotal}
        isReadOnly={isReadOnly} addLabel={addLabel} emptyLabel={emptyLabel} currency={currency} errors={errors}
        footer={footer} columnCount={columnCount}
      />
    )
  }
  const dividerClass = bordered ? 'border-r border-[#e2e8f0] last:border-r-0' : undefined
  return (
    <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#eeeeee]">
              <th scope="col" className={cn('w-8 px-2 py-2 text-center text-[11px] font-bold uppercase text-[#64748b]', dividerClass)}>
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    'px-2.5 py-2 text-[11px] font-bold uppercase text-[#64748b]',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    !column.align && 'text-left',
                    dividerClass,
                  )}
                  style={column.width ? { minWidth: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
              {getSubtotal && (
                <th scope="col" className={cn('min-w-[120px] px-2.5 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]', dividerClass)}>
                  Subtotal
                </th>
              )}
              {onRemove && <th scope="col" className="w-8 px-2 py-2" aria-label="Aksi" />}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-3 py-8 text-center text-[13px] text-[#94a3b8]"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const rowErrors = errors?.[index]
                const rowMessages = rowErrors ? Object.values(rowErrors) : []

                return (
                <Fragment key={index}>
                <tr
                  className={cn(
                    'group border-b border-[#f1f5f9] last:border-b-0',
                    !isReadOnly && 'hover:bg-[#f8fbfc]',
                    rowMessages.length > 0 && 'bg-red-50/60',
                  )}
                >
                  <td
                    className={cn(
                      'px-2 py-2 text-center text-[12px] text-[#94a3b8]',
                      rowMessages.length > 0 && 'border-l-2 border-red-500 font-semibold text-red-600',
                      dividerClass,
                    )}
                  >
                    {index + 1}
                  </td>
                  {columns.map((column) => {
                    const cellHasError = rowErrors
                      ? Object.keys(rowErrors).some((field) => fieldMatchesColumn(field, column.id))
                      : false

                    return (
                    <td
                      key={column.id}
                      className={cn(
                        'px-2.5 py-2 align-top',
                        column.align === 'right' && 'text-right tabular-nums',
                        column.align === 'center' && 'text-center',
                        cellHasError && 'rounded-sm ring-1 ring-inset ring-red-400',
                        dividerClass,
                      )}
                    >
                      {column.render({
                        item,
                        index,
                        isReadOnly,
                        onUpdate: (field, value) => onUpdate?.(index, field, value),
                      })}
                    </td>
                    )
                  })}
                  {getSubtotal && (
                    <td className={cn('px-2.5 py-2 text-right font-medium tabular-nums text-[#24323a]', dividerClass)}>
                      {formatCurrency(getSubtotal(item), currency)}
                    </td>
                  )}
                  {onRemove && <td className="px-2 py-2 text-center">
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
                  </td>}
                </tr>

                {/* Pesan error baris ditampilkan utuh di sini — kolomnya mungkin tidak
                    punya padanan sel (mis. field backend tanpa kolom di tabel), jadi
                    jangan sampai ada pesan yang hilang. */}
                {rowMessages.length > 0 && (
                  <tr className="border-b border-[#f1f5f9] bg-red-50/60">
                    <td />
                    <td colSpan={columnCount - 1} className="px-2.5 pb-2 pt-0">
                      {rowMessages.map((message) => (
                        <p key={message} className="text-[11px] text-red-500">{message}</p>
                      ))}
                    </td>
                  </tr>
                )}
                </Fragment>
                )
              })
            )}
          </tbody>

          {footer && (
            <tfoot className="border-t border-[#d9e2e5] bg-[#f8fafc]">
              {footer(items, columnCount)}
            </tfoot>
          )}
        </table>
      </div>

      {/* Baris aksi diberi latar dan garis atas sendiri supaya batas bawah tabel
          terbaca — tanpa itu tombolnya melayang di area putih yang sama dengan
          badan tabel dan tabelnya tampak tidak punya ujung. */}
      {!isReadOnly && onAdd && (
        <Button
          type="button"
          variant="ghost"
          onClick={onAdd}
          className="h-10 w-full justify-start rounded-none border-t border-[#d9e2e5] bg-[#f8fafc] px-3 text-[13px] font-medium text-[#5c9ead] hover:bg-[#eef2f5] hover:text-[#326273]"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}

/**
 * Tampilan HP: tiap baris item menjadi kartu bertumpuk (label di atas isian) dan tidak ada
 * gulir horizontal. Kontrol sel memakai gaya "flush" tanpa border, jadi dibungkus kotak
 * berbingkai supaya tetap terbaca sebagai kolom isian.
 */
function MobileLineItems<T>({
  items, columns, onAdd, onRemove, onUpdate, getSubtotal, isReadOnly, addLabel, emptyLabel, currency, errors, footer, columnCount,
}: Omit<LineItemsTableProps<T>, 'bordered'> & { isReadOnly: boolean; addLabel: string; emptyLabel: string; currency: string; columnCount: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
      {items.length === 0 ? (
        <p className="px-3 py-8 text-center text-[13px] text-[#94a3b8]">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-[#e2e8f0]">
          {items.map((item, index) => {
            const rowErrors = errors?.[index]
            const rowMessages = rowErrors ? Object.values(rowErrors) : []
            return (
              <li key={index} className={cn('space-y-2.5 p-3', rowMessages.length > 0 && 'bg-red-50/60')}>
                <div className="flex items-center justify-between">
                  <span className={cn('text-[12px] font-semibold text-[#64748b]', rowMessages.length > 0 && 'text-red-600')}>Item {index + 1}</span>
                  {onRemove && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#ef4444]"
                      aria-label={`Hapus item ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5">
                  {columns.map((column) => {
                    const cellHasError = rowErrors ? Object.keys(rowErrors).some((field) => fieldMatchesColumn(field, column.id)) : false
                    // Kolom angka (jumlah, harga, diskon) berdampingan dua-dua; kolom teks/pilihan selebar kartu.
                    const half = column.align === 'right' || (column.width !== undefined && column.width <= 130)
                    return (
                      <div key={column.id} className={cn('min-w-0', half ? 'col-span-1' : 'col-span-2')}>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{column.header}</p>
                        <div
                          className={cn(
                            'min-h-10 overflow-hidden rounded-md border border-[#d9e2e5] bg-white [&_input]:h-10 [&_button]:min-h-10',
                            column.align === 'right' && 'text-right tabular-nums',
                            isReadOnly && 'border-transparent bg-[#f8fafc]',
                            cellHasError && 'border-red-400 ring-1 ring-red-400',
                          )}
                        >
                          {column.render({ item, index, isReadOnly, onUpdate: (field, value) => onUpdate?.(index, field, value) })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {getSubtotal && (
                  <div className="flex items-center justify-between border-t border-dashed border-[#e2e8f0] pt-2 text-[13px]">
                    <span className="text-[#64748b]">Subtotal</span>
                    <span className="font-semibold tabular-nums text-[#24323a]">{formatCurrency(getSubtotal(item), currency)}</span>
                  </div>
                )}
                {rowMessages.map((message) => (
                  <p key={message} className="text-[11px] text-red-500">{message}</p>
                ))}
              </li>
            )
          })}
        </ul>
      )}
      {footer && (
        <table className="w-full border-t border-[#d9e2e5] bg-[#f8fafc] text-[13px]">
          <tfoot>{footer(items, columnCount)}</tfoot>
        </table>
      )}
      {!isReadOnly && onAdd && (
        <Button
          type="button"
          variant="ghost"
          onClick={onAdd}
          className="h-11 w-full justify-start rounded-none border-t border-[#d9e2e5] bg-[#f8fafc] px-3 text-[13px] font-medium text-[#5c9ead] hover:bg-[#eef2f5] hover:text-[#326273]"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}
