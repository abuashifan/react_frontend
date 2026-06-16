# 07 — Component Library

## Prinsip

1. **Cek dulu sebelum buat** — sebelum membuat komponen baru, cek apakah sudah ada di `src/components/ui/` atau `src/components/shared/`
2. **Satu komponen, satu tanggung jawab** — jangan buat komponen yang melakukan terlalu banyak hal
3. **Shared > duplicate** — jika komponen dipakai 2+ modul, wajib ada di `shared/`
4. **Props typing wajib** — semua props harus typed dengan interface TypeScript

---

## Layer 1 — Base UI Components (Shadcn/ui)

Lokasi: `src/components/ui/`
Sumber: Shadcn/ui CLI — **JANGAN EDIT LANGSUNG**

Komponen yang wajib di-install:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add alert
```

Jika perlu kustomisasi → buat wrapper di `src/components/shared/`.

---

## Layer 2 — Shared Business Components

Lokasi: `src/components/shared/`

### Layout Components

#### `AppShell.tsx`
Root layout wrapper. Mengatur topbar + ribbon + sidebar + content.

```tsx
interface AppShellProps {
  children: React.ReactNode
}
```

#### `Topbar.tsx`
Module tabs navigation.

```tsx
interface TopbarProps {
  modules: ModuleTab[]
  activeModule: string
  onModuleChange: (module: string) => void
  user: UserInfo
  company: CompanyInfo
}
```

#### `RibbonPanel.tsx`
Contextual ribbon menu per module.

```tsx
interface RibbonPanelProps {
  items: RibbonItem[]
  activeItem: string
  onItemClick: (item: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface RibbonItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
  permission?: string
}
```

#### `FilterSidebar.tsx`
Contextual filter panel.

```tsx
interface FilterSidebarProps {
  filters: FilterConfig[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  onReset: () => void
  isCollapsed: boolean
}
```

#### `WorkspaceLayout.tsx`
Layout untuk list/workspace view.

```tsx
interface WorkspaceLayoutProps {
  title: string
  breadcrumb?: BreadcrumbItem[]
  action?: React.ReactNode      // Tombol tambah baru
  children: React.ReactNode     // DataTable
}
```

#### `FormLayout.tsx`
Layout untuk form view (full width, sidebar hidden).

```tsx
interface FormLayoutProps {
  title: string
  documentNumber?: string
  status?: DocumentStatus
  breadcrumb?: BreadcrumbItem[]
  isSystemGenerated?: boolean
  children: React.ReactNode
}
```

---

### Document Components

#### `DocumentStatusBadge.tsx`
**WAJIB** dipakai di semua tempat yang menampilkan status dokumen.

```tsx
interface DocumentStatusBadgeProps {
  status: DocumentStatus
  size?: 'sm' | 'md'
}

// Penggunaan
<DocumentStatusBadge status="posted" />
<DocumentStatusBadge status="draft" size="sm" />
```

Status yang didukung: `draft`, `submitted`, `approved`, `confirmed`, `posted`, `partially_paid`, `paid`, `void`, `cancelled`, `rejected`, `delivered`, `received`, `converted`

#### `DocumentLockedBanner.tsx`
Banner informatif ketika dokumen terkunci karena ada dependence.

```tsx
interface DocumentLockedBannerProps {
  dependences: DocumentDependence[]
}

interface DocumentDependence {
  type: string          // 'Sales Invoice' | 'Delivery Order' | ...
  number: string        // 'INV-2026-001'
  status: DocumentStatus
  path: string          // URL untuk navigate ke dokumen tersebut
}
```

Render:
```
🔒 Dokumen ini terkunci.
   Void transaksi berikut terlebih dahulu (dari hilir ke hulu):
   · INV-2026-001 (Sales Invoice) — Posted  [Lihat →]
   · DO-2026-005 (Delivery Order) — Posted  [Lihat →]
```

#### `DocumentActionBar.tsx`
Fixed bottom bar dengan action buttons.

```tsx
interface DocumentActionBarProps {
  documentStatus: DocumentStatus
  documentNumber?: string
  actions: ActionButton[]
}

interface ActionButton {
  label: string
  variant: 'primary' | 'secondary' | 'destructive'
  permission: string
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  tooltip?: string
}
```

#### `VoidConfirmDialog.tsx`
Confirmation dialog untuk aksi void.

```tsx
interface VoidConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  documentNumber: string
  isLoading?: boolean
}
```

Dialog wajib include:
- Penjelasan dampak void
- Input reason (wajib diisi, min 10 karakter)
- Tombol confirm (merah) dan cancel

#### `SystemGeneratedBadge.tsx`
Badge untuk jurnal system-generated.

```tsx
// Render: 🔧 System Generated
<SystemGeneratedBadge />
```

---

### Table Components

#### `DataTable.tsx`
**Base table untuk semua list workspace.** Wajib dipakai — jangan buat table custom.

```tsx
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  pagination: PaginationState
  onPaginationChange: (state: PaginationState) => void
  totalRows: number
  selectedRows?: string[]
  onRowSelect?: (ids: string[]) => void
  onBulkAction?: (action: string, ids: string[]) => void
  bulkActions?: BulkAction[]
  emptyMessage?: string
}

interface PaginationState {
  pageIndex: number
  pageSize: 25 | 50 | 100    // Hanya tiga pilihan ini
}
```

Features yang sudah include:
- Checkbox kolom pertama (sticky left)
- Horizontal scroll
- Pagination dengan page size 25/50/100
- Loading skeleton
- Empty state
- Bulk action bar

#### `TablePagination.tsx`
Pagination control yang dipakai oleh DataTable.

```tsx
// Page size options: [25, 50, 100]
// Default: 25
```

#### `BulkActionBar.tsx`
Bar yang muncul saat ada row yang di-select.

```tsx
interface BulkActionBarProps {
  selectedCount: number
  actions: BulkAction[]
  onClearSelection: () => void
}
```

---

### Form Components

Detail lengkap → `08-form-architecture.md`

#### `FormSection.tsx`
Section wrapper dengan 2-column grid.

```tsx
interface FormSectionProps {
  title?: string
  children: React.ReactNode
  columns?: 1 | 2          // Default: 2
}
```

#### `SearchableSelect.tsx`
Dropdown searchable untuk semua picker (customer, vendor, product, dll.).

```tsx
interface SearchableSelectProps {
  value: number | null
  onChange: (value: number | null) => void
  onSearch: (query: string) => Promise<SelectOption[]>
  placeholder?: string
  disabled?: boolean
  error?: string
}

interface SelectOption {
  value: number
  label: string
  sublabel?: string    // Info tambahan (kode akun, dll.)
}
```

Behavior:
- Minimum 2 karakter untuk trigger search
- Debounce 300ms
- Maksimal 10 hasil di dropdown
- Jika kosong: "Tidak ditemukan"
- Keyboard: arrow up/down, enter, escape

#### `LineItemsTable.tsx`
Base table untuk line items di form transaksi.

```tsx
interface LineItemsTableProps<T> {
  items: T[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: string, value: unknown) => void
  columns: LineItemColumn<T>[]
  isReadOnly?: boolean
}
```

#### `FormSummary.tsx`
Summary total di bagian bawah form (subtotal, tax, grand total).

```tsx
interface FormSummaryProps {
  subtotal: number
  taxAmount?: number
  discountAmount?: number
  grandTotal: number
  paidAmount?: number
  balanceDue?: number
  currency?: string      // Default: 'IDR'
}
```

---

### Feedback Components

#### `ToastProvider.tsx`
Provider untuk toast notification. Dipasang di root App.

```tsx
// Penggunaan di komponen manapun
import { useToast } from '@/hooks/useToast'

const { toast } = useToast()

toast.success('Invoice berhasil diposting')
toast.error('Gagal menyimpan. Customer wajib dipilih.')
toast.warning('Periode akuntansi akan ditutup.')
toast.info('Data disinkronkan.')
```

Toast specs:
- Posisi: pojok kanan bawah
- Max stack: 3
- Auto-dismiss: success 3s, error 5s, warning 4s, info 3s
- User bisa dismiss manual (klik X)

#### `EmptyState.tsx`
Empty state untuk DataTable kosong.

```tsx
interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

// Contoh
<EmptyState
  title="Belum ada invoice"
  description="Buat invoice pertama untuk memulai."
  action={<CreateInvoiceButton />}
/>
```

---

## Aturan Pembuatan Komponen Baru

Sebelum membuat komponen baru, jawab pertanyaan ini:

1. **Sudah ada di Shadcn/ui?** → Pakai, jangan buat ulang
2. **Sudah ada di shared/?** → Pakai atau extend dengan props baru
3. **Hanya dipakai satu modul?** → Buat di `modules/{module}/components/`
4. **Dipakai 2+ modul?** → Buat langsung di `shared/` atau pindahkan

Setiap komponen baru WAJIB:
- Interface props yang typed penuh
- JSDoc comment singkat di atas komponen
- Export named (bukan default export) kecuali page components
