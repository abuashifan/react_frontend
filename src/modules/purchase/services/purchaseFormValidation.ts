/**
 * Validasi line transaksi Purchase sebelum submit (A13-163). Sejajar dengan
 * `salesFormValidation` (Phase 28): line berada di state terpisah dari RHF/Zod,
 * jadi divalidasi eksplisit di sini agar backend (`description` wajib,
 * `quantity gt:0`) tidak ditolak setelah request.
 *
 * mode:
 * - `item`    : PR/PO/GR/Bill/Return — butuh deskripsi, qty > 0, harga >= 0.
 * - `payment` : Vendor Payment — butuh bill terpilih dan jumlah bayar > 0.
 */
interface PurchaseLineValue {
  description?: string
  quantity?: number
  unit_price?: number
  estimated_price?: number
  discount_percent?: number
  tax_percent?: number
  amount?: number
  vendor_bill_id?: number | null
  balance_due?: number
}

export function validatePurchaseLines(lines: PurchaseLineValue[], mode: 'item' | 'payment' = 'item'): string[] {
  if (lines.length === 0) return ['Minimal satu baris wajib diisi.']

  return lines.flatMap((line, index) => {
    const errors: string[] = []
    const row = index + 1

    if (mode === 'payment') {
      if (!line.vendor_bill_id) errors.push(`Baris ${row}: tagihan vendor wajib dipilih.`)
      if (!Number.isFinite(line.amount) || Number(line.amount) <= 0) {
        errors.push(`Baris ${row}: jumlah bayar harus lebih dari 0.`)
      }
      if (line.balance_due !== undefined && Number(line.amount) > Number(line.balance_due)) {
        errors.push(`Baris ${row}: jumlah bayar melebihi sisa tagihan.`)
      }
      return errors
    }

    const price = line.unit_price ?? line.estimated_price
    if (!line.description?.trim()) errors.push(`Baris ${row}: deskripsi wajib diisi.`)
    if (!Number.isFinite(line.quantity) || Number(line.quantity) <= 0) errors.push(`Baris ${row}: kuantitas harus lebih dari 0.`)
    // Harga hanya divalidasi untuk resource yang memang punya kolom harga
    // (GR hanya deskripsi + qty).
    if (price !== undefined && (!Number.isFinite(price) || Number(price) < 0)) errors.push(`Baris ${row}: harga tidak boleh negatif.`)
    if (Number(line.discount_percent ?? 0) < 0 || Number(line.discount_percent ?? 0) > 100) errors.push(`Baris ${row}: diskon harus 0-100%.`)
    if (Number(line.tax_percent ?? 0) < 0 || Number(line.tax_percent ?? 0) > 100) errors.push(`Baris ${row}: pajak harus 0-100%.`)

    return errors
  })
}
