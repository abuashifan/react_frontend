interface SalesLineValue {
  description?: string
  quantity?: number
  unit_price?: number
  discount_percent?: number
  tax_percent?: number
  amount?: number
  balance_due?: number
}

export function validateSalesLines(lines: SalesLineValue[], mode: 'item' | 'receipt' = 'item'): string[] {
  if (lines.length === 0) return ['Minimal satu baris wajib diisi.']

  return lines.flatMap((line, index) => {
    const errors: string[] = []
    const row = index + 1

    if (mode === 'receipt') {
      if (!Number.isFinite(line.amount) || Number(line.amount) <= 0) {
        errors.push(`Baris ${row}: jumlah bayar harus lebih dari 0.`)
      }
      if (Number(line.amount) > Number(line.balance_due ?? 0)) {
        errors.push(`Baris ${row}: jumlah bayar melebihi sisa tagihan.`)
      }
      return errors
    }

    if (!line.description?.trim()) errors.push(`Baris ${row}: deskripsi wajib diisi.`)
    if (!Number.isFinite(line.quantity) || Number(line.quantity) <= 0) errors.push(`Baris ${row}: kuantitas harus lebih dari 0.`)
    if (!Number.isFinite(line.unit_price) || Number(line.unit_price) < 0) errors.push(`Baris ${row}: harga tidak boleh negatif.`)
    if (Number(line.discount_percent ?? 0) < 0 || Number(line.discount_percent ?? 0) > 100) errors.push(`Baris ${row}: diskon harus 0-100%.`)
    if (Number(line.tax_percent ?? 0) < 0 || Number(line.tax_percent ?? 0) > 100) errors.push(`Baris ${row}: pajak harus 0-100%.`)

    return errors
  })
}
