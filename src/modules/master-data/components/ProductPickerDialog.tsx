import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { formatCurrency } from '@/lib/utils'
import { produkApi } from '../services/produkApi'
import type { Produk } from '../types/produk.types'

interface ProductPickerDialogProps {
  open: boolean
  onClose: () => void
  /** Dipanggil saat Simpan dengan semua produk yang dicentang, sesuai urutan pilih per halaman. */
  onConfirm: (products: Produk[]) => void
  title?: string
  /** Harga yang ditampilkan di tabel: harga jual (transaksi penjualan) atau harga beli (pembelian). */
  priceField?: 'selling_price' | 'purchase_price'
}

const PAGE_SIZE = 25

/**
 * Dialog pemilih produk multi-pilih untuk baris transaksi.
 *
 * Pola yang sama dengan `AccountPickerDialog`: pencarian ke server, checkbox,
 * paginasi, dan seleksi yang bertahan lintas halaman (yang dikirim `DataTable`
 * hanya seleksi halaman aktif, jadi pilihan dari halaman lain digabung kembali
 * di sini). Memilih N produk mengisi N baris sekaligus -- lihat pemanggilnya.
 */
export function ProductPickerDialog({
  open,
  onClose,
  onConfirm,
  title = 'Pilih Produk',
  priceField = 'selling_price',
}: ProductPickerDialogProps) {
  const [searchInput, setSearchInput] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)
  // Produk terpilih disimpan utuh supaya tetap bisa dikembalikan saat Simpan
  // walau barisnya sudah tidak ada di data halaman aktif.
  const [selected, setSelected] = useState<Produk[]>([])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['master-data', 'products', 'picker', applied, page],
    queryFn: () =>
      produkApi.list({ page: page + 1, per_page: PAGE_SIZE, search: applied || undefined, is_active: true }),
    enabled: open,
  })

  const rows = useMemo(() => data?.data ?? [], [data])

  const pageIds = rows.map((product) => String(product.id))
  const selectedOnPage = selected.map((product) => String(product.id)).filter((id) => pageIds.includes(id))

  const handleClose = () => {
    setSearchInput('')
    setApplied('')
    setPage(0)
    setSelected([])
    onClose()
  }

  const handleSearch = () => {
    setApplied(searchInput.trim())
    setPage(0)
  }

  const handleRowSelect = (nextOnPage: string[]) => {
    const fromOtherPages = selected.filter((product) => !pageIds.includes(String(product.id)))
    const pickedOnPage = nextOnPage
      .map((id) => rows.find((product) => String(product.id) === id))
      .filter((product): product is Produk => Boolean(product))

    setSelected([...fromOtherPages, ...pickedOnPage])
  }

  const handleConfirm = () => {
    onConfirm(selected)
    handleClose()
  }

  const columns: ColumnDef<Produk>[] = [
    {
      id: 'product_code',
      header: 'Kode',
      size: 110,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => original.product_code ?? '-',
    },
    {
      id: 'product_name',
      header: 'Nama Produk',
      size: 240,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => original.product_name,
    },
    {
      id: 'unit',
      header: 'Satuan',
      size: 80,
      meta: { className: 'px-2', headerClassName: 'px-2' },
      cell: ({ original }) => original.unit?.name ?? '-',
    },
    {
      id: 'price',
      header: priceField === 'selling_price' ? 'Harga Jual' : 'Harga Beli',
      size: 120,
      meta: { className: 'px-2 text-right tabular-nums', headerClassName: 'px-2 text-right' },
      cell: ({ original }) => formatCurrency(original[priceField] ?? 0),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[720px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-[#d9e2e5] bg-[#326273] px-4 py-2.5">
          <DialogTitle className="text-[14px] font-semibold text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-2.5">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            placeholder="Cari kode atau nama produk"
            aria-label="Cari produk"
            autoFocus
            className="h-8 min-w-[200px] flex-1 text-[12px]"
          />
          <Button type="button" onClick={handleSearch} className="h-8 bg-[#5c9ead] px-4 text-[12px] hover:bg-[#4a8a9b]">
            Cari
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput('')
              setApplied('')
              setPage(0)
            }}
            className="h-8 px-4 text-[12px]"
          >
            Reset
          </Button>
        </div>

        <div className="min-h-0 flex-1 px-4 py-3">
          <div className="h-[320px] [@media(max-height:620px)]:h-[220px]">
            <DataTable
              data={rows}
              columns={columns}
              totalRows={data?.meta.total ?? 0}
              isLoading={isLoading}
              isFetching={isFetching}
              pagination={{ pageIndex: page, pageSize: PAGE_SIZE }}
              onPaginationChange={(next) => setPage(next.pageIndex)}
              selectedRows={selectedOnPage}
              onRowSelect={handleRowSelect}
              emptyTitle="Produk tidak ditemukan"
              emptyDescription="Ubah kata kunci pencarian."
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[#d9e2e5] px-4 py-2.5">
          <span className="text-[12px] text-[#64748b]">
            {selected.length > 0 ? `${selected.length} produk dipilih` : 'Belum ada produk dipilih'}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="h-8 px-4 text-[13px]">
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="h-8 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
            >
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
