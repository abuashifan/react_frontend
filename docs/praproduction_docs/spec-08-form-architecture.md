# 08 — Form Architecture & Validation

## Prinsip

1. **React Hook Form + Zod** — semua form tanpa terkecuali
2. **Schema di file terpisah** — semua Zod schema ada di `modules/{module}/schemas/`
3. **Field component dari shared** — tidak ada custom input yang dibuat ulang per form
4. **Error dari backend = toast** — validation error 422 ditampilkan via toast, bukan inline
5. **Form state tidak keluar ke store** — form state hanya hidup di React Hook Form

---

## Pattern Standar Form

```typescript
// modules/sales/schemas/createSalesInvoiceSchema.ts
import { z } from 'zod'

export const createSalesInvoiceSchema = z.object({
  customer_id: z.number({
    required_error: 'Customer wajib dipilih',
    invalid_type_error: 'Customer tidak valid',
  }),
  invoice_date: z.string().min(1, 'Tanggal invoice wajib diisi'),
  due_date: z.string().min(1, 'Due date wajib diisi'),
  payment_term_id: z.number().optional(),
  warehouse_id: z.number().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    product_id: z.number({ required_error: 'Produk wajib dipilih' }),
    quantity: z.number().positive('Quantity harus lebih dari 0'),
    unit_price: z.number().min(0, 'Harga tidak boleh negatif'),
    discount_percent: z.number().min(0).max(100).optional(),
  })).min(1, 'Minimal satu item harus diisi'),
})

export type CreateSalesInvoiceValues = z.infer<typeof createSalesInvoiceSchema>
```

```typescript
// modules/sales/components/SalesInvoiceForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSalesInvoiceSchema, type CreateSalesInvoiceValues } from '../schemas/createSalesInvoiceSchema'

export function SalesInvoiceForm({ invoice }: { invoice?: SalesInvoice }) {
  const form = useForm<CreateSalesInvoiceValues>({
    resolver: zodResolver(createSalesInvoiceSchema),
    defaultValues: invoice ? mapInvoiceToForm(invoice) : {
      customer_id: undefined,
      invoice_date: new Date().toISOString().split('T')[0],
      lines: [],
    }
  })

  const { handleSubmit, formState: { isSubmitting } } = form

  const onSubmit = async (values: CreateSalesInvoiceValues) => {
    // submit logic
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* form content */}
      </form>
    </Form>
  )
}
```

---

## Form Layout Structure

### Struktur Wajib untuk Form Transaksi

```tsx
<FormLayout title="Sales Invoice" documentNumber="INV-2026-001" status={invoice.status}>

  {/* 1. Document header info (read-only jika bukan draft) */}
  <DocumentInfoBar
    number={invoice.invoice_number}
    status={invoice.status}
    createdAt={invoice.created_at}
    createdBy={invoice.created_by}
  />

  {/* 2. Locked banner (jika ada dependence) */}
  {isLocked && <DocumentLockedBanner dependences={dependences} />}

  {/* 3. System generated badge (untuk jurnal otomatis) */}
  {isSystemGenerated && <SystemGeneratedBadge />}

  {/* 4. Header form — 2 column grid */}
  <FormSection title="Informasi Dokumen">
    <FormField name="customer_id" label="Customer" required>
      <SearchableSelect ... />
    </FormField>
    <FormField name="invoice_date" label="Tanggal Invoice" required>
      <DatePicker ... />
    </FormField>
    <FormField name="due_date" label="Due Date" required>
      <DatePicker ... />
    </FormField>
    <FormField name="payment_term_id" label="Syarat Pembayaran">
      <SearchableSelect ... />
    </FormField>
    {/* Notes — full width, span 2 kolom */}
    <FormField name="notes" label="Catatan" className="col-span-2">
      <Textarea ... />
    </FormField>
  </FormSection>

  {/* 5. Line items */}
  <FormSection title="Item">
    <LineItemsTable ... />
  </FormSection>

  {/* 6. Summary */}
  <FormSummary
    subtotal={subtotal}
    taxAmount={taxAmount}
    grandTotal={grandTotal}
  />

  {/* Fixed bottom bar di-render oleh FormLayout */}
</FormLayout>
```

---

## Form Section — 2 Column Grid

```tsx
// FormSection.tsx
<div className="bg-white rounded-lg border border-[#d9e2e5] p-4 lg:p-5">
  {title && (
    <h3 className="text-sm font-semibold text-[#24323a] mb-4 pb-3 border-b border-[#d9e2e5]">
      {title}
    </h3>
  )}
  <div className={cn(
    "grid gap-4 lg:gap-5",
    columns === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
  )}>
    {children}
  </div>
</div>
```

---

## Field yang Span Full Width (2 Kolom)

Field berikut selalu full width di 2-column grid:

```tsx
// Tambahkan className="md:col-span-2"
<FormField name="notes" className="md:col-span-2">
<FormField name="description" className="md:col-span-2">
<FormField name="address" className="md:col-span-2">
```

---

## Read-Only Mode

Form read-only ketika `isEditable === false`.

```tsx
// Semua field menjadi read-only
<FormField name="customer_id" readOnly={!isEditable}>
  <SearchableSelect disabled={!isEditable} ... />
</FormField>

// Input read-only styling
className={cn(
  "...",
  !isEditable && "bg-[#f8fbfc] cursor-not-allowed text-[#64748b]"
)}
```

**DILARANG** hide form field saat read-only — field tetap tampil tapi disabled.

---

## Validation Error Handling

### Client-side (Zod)
Error tampil di bawah field masing-masing:

```tsx
<FormField
  control={form.control}
  name="customer_id"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
      <FormControl>
        <SearchableSelect {...field} error={fieldState.error?.message} />
      </FormControl>
      <FormMessage /> {/* Error message dari Zod */}
    </FormItem>
  )}
/>
```

### Server-side (422 dari API)
Error dari backend ditampilkan via toast:

```typescript
// Di mutation handler
const mutation = useMutation({
  mutationFn: salesInvoiceApi.create,
  onError: (error: ApiError) => {
    if (error.code === 'VALIDATION_ERROR' && error.errors) {
      // Format semua error jadi satu pesan
      const messages = Object.values(error.errors).flat().join('. ')
      toast.error(`Gagal menyimpan. ${messages}`)
    } else {
      toast.error(error.message || 'Terjadi kesalahan. Coba lagi.')
    }
  },
  onSuccess: () => {
    toast.success('Invoice berhasil disimpan.')
    navigate('/sales/invoices')
  }
})
```

---

## Date Picker

Gunakan native HTML date input dengan formatting:

```tsx
// DatePicker.tsx
<input
  type="date"
  className="h-[34px] lg:h-9 w-full rounded-md border border-[#d9e2e5] 
             bg-white px-3 text-[13px] lg:text-sm text-[#24323a]
             focus:outline-none focus:ring-2 focus:ring-[#5c9ead] focus:border-transparent
             disabled:bg-[#f8fbfc] disabled:cursor-not-allowed"
  {...field}
/>
```

---

## Amount/Number Input

```tsx
// NumberInput.tsx — untuk qty, harga, diskon
<input
  type="number"
  min={0}
  step="0.01"
  className="h-[34px] lg:h-9 w-full rounded-md border border-[#d9e2e5]
             bg-white px-3 text-[13px] lg:text-sm text-right tabular-nums
             focus:outline-none focus:ring-2 focus:ring-[#5c9ead]"
  {...field}
  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
/>
```

**Catatan**: Amount selalu `text-right` dan `tabular-nums`.

---

## Line Items Table

```tsx
// LineItemsTable — horizontal scroll, semua kolom tampil
<div className="overflow-x-auto">
  <table className="min-w-full">
    <thead>
      <tr className="bg-[#eeeeee]">
        <th className="min-w-[200px] ...">Produk</th>
        <th className="min-w-[180px] ...">Deskripsi</th>
        <th className="min-w-[80px] text-right ...">Qty</th>
        <th className="min-w-[80px] ...">Satuan</th>
        <th className="min-w-[120px] text-right ...">Harga</th>
        <th className="min-w-[80px] text-right ...">Diskon %</th>
        <th className="min-w-[80px] text-right ...">Tax</th>
        <th className="min-w-[130px] text-right ...">Subtotal</th>
        <th className="w-8 ...">×</th>  {/* Delete button */}
      </tr>
    </thead>
    <tbody>
      {fields.map((field, index) => (
        <LineItemRow
          key={field.id}
          index={index}
          control={form.control}
          onRemove={() => remove(index)}
          isReadOnly={!isEditable}
        />
      ))}
    </tbody>
  </table>
</div>

{/* Add row button */}
{isEditable && (
  <button onClick={() => append(emptyLine)} className="...">
    + Tambah Item
  </button>
)}
```

---

## Auto-calculation

Semua kalkulasi dilakukan di client side, bukan menunggu API:

```typescript
// useInvoiceCalculation.ts
export function useInvoiceCalculation(lines: InvoiceLine[]) {
  return useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      const lineTotal = line.quantity * line.unit_price
      const discount = lineTotal * (line.discount_percent || 0) / 100
      return sum + lineTotal - discount
    }, 0)

    const taxAmount = lines.reduce((sum, line) => {
      // tax calculation
      return sum + line.tax_amount
    }, 0)

    return {
      subtotal,
      taxAmount,
      grandTotal: subtotal + taxAmount,
    }
  }, [lines])
}
```

**Catatan**: Nilai final yang dikirim ke API harus sama dengan kalkulasi backend. Jika ada discrepancy, backend yang menang (422 error).
