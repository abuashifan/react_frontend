import { useState, type Dispatch, type SetStateAction } from 'react'
import type { Produk } from '../types/produk.types'

/** Baris dokumen yang punya produk; dipakai form pembelian dan penjualan untuk pemilih produk via dialog. */
export interface PickableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  /** Tidak semua dokumen punya deskripsi per baris (mis. mutasi dan penyesuaian stok). */
  description?: string
}

/**
 * Produk pada baris dokumen dari server. Backend mengirim model Product apa adanya
 * (`product_code`/`product_name`), sedangkan tipe frontend menyebutnya `code`/`name`;
 * terima keduanya supaya label sel produk tidak kosong untuk dokumen yang sudah tersimpan.
 */
export function toLineProduct(
  product: unknown,
  productId: number,
): { id: number; code: string; name: string } | null {
  if (!product || typeof product !== 'object') return null
  const p = product as { code?: string; name?: string; product_code?: string; product_name?: string }
  return { id: productId, code: p.code ?? p.product_code ?? '', name: p.name ?? p.product_name ?? String(productId) }
}

type PickerTarget = number | 'append' | null

interface UseProductLinePickerOptions<TLine extends PickableLine> {
  defaultLine: TLine
  setLines: Dispatch<SetStateAction<TLine[]>>
  /** Isi tambahan per dokumen, mis. harga dari `purchase_price`. */
  applyProduct?: (product: Produk, line: TLine) => TLine
  /** Isi `description` baris dengan nama produk (bawaan ya); matikan untuk dokumen tanpa deskripsi baris. */
  fillDescription?: boolean
  /** Harga yang ditampilkan di dialog: harga beli (pembelian, bawaan) atau harga jual (penjualan). */
  priceField?: 'selling_price' | 'purchase_price'
}

/**
 * Pola pemilih produk yang sama dengan Faktur Penjualan (dipakai pembelian dan penjualan): sel produk membuka dialog
 * multi-pilih (`ProductPickerDialog`) dan N produk terpilih mengisi N baris. Produk pertama
 * mengisi baris pemicu (qty dan isian lain dipertahankan), sisanya jadi baris baru di
 * bawahnya; dari tombol tambah, baris kosong terakhir dipakai dulu.
 */
export function useProductLinePicker<TLine extends PickableLine>({ defaultLine, setLines, applyProduct, priceField = 'purchase_price', fillDescription = true }: UseProductLinePickerOptions<TLine>) {
  const [target, setTarget] = useState<PickerTarget>(null)

  const toLine = (product: Produk, base: TLine): TLine => {
    const filled: TLine = {
      ...base,
      product_id: product.id,
      product: { id: product.id, code: product.product_code ?? '', name: product.product_name },
      ...(fillDescription ? { description: product.product_name } : {}),
    }
    return applyProduct ? applyProduct(product, filled) : filled
  }

  const onConfirm = (products: Produk[]) => {
    if (products.length === 0 || target === null) return
    setLines((prev) => {
      if (target === 'append') {
        const added = products.map((product) => toLine(product, { ...defaultLine }))
        const last = prev[prev.length - 1]
        const lastIsEmpty = last !== undefined && last.product_id === null && !(last.description ?? '').trim()
        return lastIsEmpty ? [...prev.slice(0, -1), ...added] : [...prev, ...added]
      }
      const [first, ...rest] = products
      const next = [...prev]
      next[target] = toLine(first, prev[target])
      next.splice(target + 1, 0, ...rest.map((product) => toLine(product, { ...defaultLine })))
      return next
    })
  }

  return {
    openAt: (index: number) => setTarget(index),
    openAppend: () => setTarget('append'),
    dialogProps: {
      open: target !== null,
      onClose: () => setTarget(null),
      onConfirm,
      priceField,
    },
  }
}
