# 09 — Table & List Components

## Prinsip

- Semua list workspace menggunakan `DataTable` — **satu komponen, konsisten**
- Horizontal scroll diizinkan — jangan sembunyikan kolom
- Kolom checkbox **selalu pertama**, sticky kiri
- Klik nomor transaksi = buka form (styled sebagai link `#5c9ead`)
- Tidak ada kolom "Aksi" — aksi dilakukan via bulk action atau di dalam form
- Pagination: 25 (default) / 50 / 100 rows

---

## DataTable Props

```typescript
interface DataTableProps<T extends { id: number | string }> {
  // Data
  data: T[]
  columns: ColumnDef<T>[]
  totalRows: number

  // Loading
  isLoading?: boolean
  isFetching?: boolean     // untuk refetch indicator

  // Pagination
  pagination: PaginationState
  onPaginationChange: (state: PaginationState) => void

  // Selection & Bulk Actions
  selectedRows?: string[]
  onRowSelect?: (ids: string[]) => void
  bulkActions?: BulkAction[]

  // Empty state
  emptyTitle?: string
  emptyDescription?: string
}

interface PaginationState {
  pageIndex: number        // 0-based
  pageSize: 25 | 50 | 100
}

interface BulkAction {
  id: string
  label: string
  icon?: LucideIcon
  variant?: 'default' | 'destructive'
  permission: string
  onClick: (selectedIds: string[]) => void
}
```

---

## Column Definitions

### Kolom Wajib (Selalu Ada)

```typescript
// 1. Checkbox column — SELALU PERTAMA, STICKY
const checkboxColumn: ColumnDef<T> = {
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
    />
  ),
  enableSorting: false,
  enableHiding: false,
  size: 32,
  meta: { sticky: true },
}

// 2. Nomor transaksi — SELALU KEDUA, STYLED SEBAGAI LINK
const numberColumn: ColumnDef<SalesInvoice> = {
  accessorKey: 'invoice_number',
  header: 'No. Invoice',
  cell: ({ row }) => (
    <Link
      to={`/sales/invoices/${row.original.id}`}
      className="font-medium text-[#5c9ead] hover:text-[#326273] hover:underline"
    >
      {row.original.invoice_number}
    </Link>
  ),
  size: 140,
  meta: { sticky: true, stickyLeft: 32 }, // setelah checkbox
}
```

### Kolom Status

```typescript
const statusColumn: ColumnDef<SalesInvoice> = {
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => (
    <DocumentStatusBadge status={row.original.status} size="sm" />
  ),
  size: 110,
}
```

### Kolom Amount

```typescript
const amountColumn: ColumnDef<SalesInvoice> = {
  accessorKey: 'grand_total',
  header: () => <span className="block text-right">Total</span>,
  cell: ({ row }) => (
    <span className="block text-right tabular-nums text-[13px] lg:text-sm font-medium">
      {formatCurrency(row.original.grand_total)}
    </span>
  ),
  size: 130,
}
```

### Kolom Tanggal

```typescript
const dateColumn: ColumnDef<SalesInvoice> = {
  accessorKey: 'invoice_date',
  header: 'Tanggal',
  cell: ({ row }) => (
    <span className="text-[#64748b] text-[13px] lg:text-sm">
      {formatDate(row.original.invoice_date)}
    </span>
  ),
  size: 100,
}
```

---

## Sticky Columns Implementation

```tsx
// DataTable.tsx — sticky columns dengan shadow indicator
<table className="min-w-full border-collapse">
  <thead>
    <tr className="bg-[#eeeeee]">
      {/* Sticky checkbox header */}
      <th className={cn(
        "sticky left-0 z-20 bg-[#eeeeee]",
        "w-8 px-3 py-2",
        "text-[10px] lg:text-[11px] font-bold uppercase tracking-wide text-[#64748b]",
        "border-b border-[#d9e2e5]",
        // Shadow saat di-scroll
        "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#d9e2e5]"
      )}>
        <Checkbox ... />
      </th>

      {/* Sticky nomor transaksi header */}
      <th className={cn(
        "sticky left-8 z-20 bg-[#eeeeee]",
        "min-w-[140px] px-3 py-2 text-left",
        "..."
      )}>
        No. Invoice
      </th>

      {/* Kolom biasa */}
      {/* ... */}
    </tr>
  </thead>
</table>
```

---

## Pagination Component

```tsx
// TablePagination.tsx
interface TablePaginationProps {
  totalRows: number
  pageIndex: number
  pageSize: 25 | 50 | 100
  onPageChange: (page: number) => void
  onPageSizeChange: (size: 25 | 50 | 100) => void
}

// Render:
// Showing 1-25 of 143 results
// [25 ▼] [< Prev] [1] [2] [3] ... [6] [Next >]
```

Page size options: **25, 50, 100** — tidak ada yang lain.

```tsx
<Select
  value={String(pageSize)}
  onValueChange={(val) => onPageSizeChange(Number(val) as 25 | 50 | 100)}
>
  <SelectItem value="25">25 baris</SelectItem>
  <SelectItem value="50">50 baris</SelectItem>
  <SelectItem value="100">100 baris</SelectItem>
</Select>
```

---

## Bulk Action Bar

Muncul di atas table ketika ada row yang di-select:

```tsx
// BulkActionBar.tsx
// Animasi: slide down dari atas table
{selectedCount > 0 && (
  <div className="flex items-center gap-3 px-4 py-2 bg-[#EFF9FB] border border-[#5c9ead] rounded-lg mb-2">
    <span className="text-sm text-[#326273] font-medium">
      {selectedCount} item dipilih
    </span>
    <div className="flex-1" />
    <button onClick={onClearSelection} className="text-xs text-[#64748b] hover:text-[#24323a]">
      Batalkan pilihan
    </button>
    {bulkActions.map(action => (
      <PermissionGuard key={action.id} permission={action.permission}>
        <Button
          variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => action.onClick(selectedIds)}
        >
          {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
          {action.label}
        </Button>
      </PermissionGuard>
    ))}
  </div>
)}
```

---

## Loading State

```tsx
// Skeleton rows saat isLoading
{isLoading ? (
  Array.from({ length: pageSize }).map((_, i) => (
    <tr key={i}>
      <td><Skeleton className="h-4 w-4" /></td>
      <td><Skeleton className="h-4 w-32" /></td>
      <td><Skeleton className="h-4 w-24" /></td>
      <td><Skeleton className="h-4 w-20" /></td>
      <td><Skeleton className="h-5 w-16 rounded-full" /></td>
    </tr>
  ))
) : (
  // actual rows
)}
```

---

## Empty State

```tsx
// Ketika data kosong
{!isLoading && data.length === 0 && (
  <tr>
    <td colSpan={columns.length} className="py-16 text-center">
      <EmptyState
        title={emptyTitle || 'Belum ada data'}
        description={emptyDescription}
      />
    </td>
  </tr>
)}
```

---

## Contoh Kolom per Dokumen

### Sales Invoice List Columns

```typescript
export const salesInvoiceColumns: ColumnDef<SalesInvoice>[] = [
  checkboxColumn,
  {
    accessorKey: 'invoice_number',
    header: 'No. Invoice',
    cell: ({ row }) => <TransactionLink ... />,
    size: 140,
  },
  {
    accessorKey: 'customer.name',
    header: 'Customer',
    size: 180,
  },
  {
    accessorKey: 'invoice_date',
    header: 'Tgl Invoice',
    cell: ({ row }) => formatDate(row.original.invoice_date),
    size: 100,
  },
  {
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => formatDate(row.original.due_date),
    size: 100,
  },
  {
    accessorKey: 'grand_total',
    header: () => <span className="block text-right">Total</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {formatCurrency(row.original.grand_total)}
      </span>
    ),
    size: 130,
  },
  {
    accessorKey: 'paid_amount',
    header: () => <span className="block text-right">Dibayar</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums text-[#065F46]">
        {formatCurrency(row.original.paid_amount)}
      </span>
    ),
    size: 130,
  },
  {
    accessorKey: 'balance_due',
    header: () => <span className="block text-right">Sisa</span>,
    cell: ({ row }) => (
      <span className={cn(
        "block text-right tabular-nums font-medium",
        row.original.balance_due > 0 ? "text-[#991B1B]" : "text-[#065F46]"
      )}>
        {formatCurrency(row.original.balance_due)}
      </span>
    ),
    size: 130,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <DocumentStatusBadge status={row.original.status} size="sm" />,
    size: 110,
  },
]
```

---

## Utility Functions

```typescript
// src/lib/utils.ts

export function formatCurrency(amount: string | number, currency = 'IDR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}
```
