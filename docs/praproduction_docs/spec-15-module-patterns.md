# 15 — Module Implementation Patterns

## Cara Membangun Modul Baru

Ikuti urutan ini setiap kali membangun workspace/modul baru:

```
1. Buat types         → modules/{module}/types/{entity}.types.ts
2. Buat schema        → modules/{module}/schemas/create{Entity}Schema.ts
3. Buat API service   → modules/{module}/services/{entity}Api.ts
4. Buat hooks         → modules/{module}/hooks/use{Entity}List.ts, use{Entity}Form.ts
5. Buat list page     → modules/{module}/pages/{Entity}ListPage.tsx
6. Buat form page     → modules/{module}/pages/{Entity}FormPage.tsx
7. Buat routes        → modules/{module}/routes.tsx
8. Register ribbon    → update RibbonPanel config
```

---

## Template: Types

```typescript
// modules/sales/types/salesInvoice.types.ts

export type SalesInvoiceStatus =
  | 'draft'
  | 'approved'
  | 'posted'
  | 'partially_paid'
  | 'paid'
  | 'void'

export interface SalesInvoice {
  id: number
  invoice_number: string
  customer_id: number
  customer: {
    id: number
    name: string
    code: string
  }
  invoice_date: string        // ISO 8601: YYYY-MM-DD
  due_date: string
  payment_term_id: number | null
  warehouse_id: number | null
  status: SalesInvoiceStatus
  notes: string | null
  subtotal: string            // Decimal sebagai string dari API
  tax_total: string
  discount_total: string
  grand_total: string
  paid_amount: string
  returned_amount: string
  balance_due: string
  is_system_generated: boolean
  lines: SalesInvoiceLine[]
  created_at: string
  updated_at: string
  created_by: string
}

export interface SalesInvoiceLine {
  id: number
  product_id: number
  product: {
    id: number
    name: string
    code: string
  }
  description: string | null
  quantity: string
  unit_id: number
  unit: { id: number; name: string }
  unit_price: string
  discount_percent: string
  tax_amount: string
  subtotal: string
  returned_quantity: string
}

export interface SalesInvoiceListParams {
  page: number
  per_page: 25 | 50 | 100
  search?: string
  status?: string[]
  customer_id?: number
  date_from?: string
  date_to?: string
  payment_status?: string[]
}

export interface CreateSalesInvoicePayload {
  customer_id: number
  invoice_date: string
  due_date: string
  payment_term_id?: number
  warehouse_id?: number
  notes?: string
  lines: {
    product_id: number
    description?: string
    quantity: number
    unit_id: number
    unit_price: number
    discount_percent?: number
    tax_rate_id?: number
  }[]
}
```

---

## Template: List Page

```typescript
// modules/sales/pages/SalesInvoiceListPage.tsx

import { useSalesInvoiceList } from '../hooks/useSalesInvoiceList'
import { useFilterState } from '@/hooks/useFilterState'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { salesInvoiceColumns } from '../components/SalesInvoiceColumns'
import { PermissionGuard } from '@/components/shared/PermissionGuard'

export default function SalesInvoiceListPage() {
  const { filters, updateFilter } = useFilterState({
    page: 1,
    per_page: 25,
  })

  const { data, isLoading, isFetching } = useSalesInvoiceList(filters)

  const handleBulkVoid = (selectedIds: string[]) => {
    // bulk void logic
  }

  return (
    <WorkspaceLayout
      title="Sales Invoice"
      breadcrumb={[
        { label: 'Penjualan', href: '/sales' },
        { label: 'Invoice' },
      ]}
      action={
        <PermissionGuard permission="sales.invoices.create">
          <Link to="/sales/invoices/create">
            <Button className="bg-[#e39774] hover:bg-[#d4845e]">
              + Buat Invoice
            </Button>
          </Link>
        </PermissionGuard>
      }
    >
      <DataTable
        data={data?.data ?? []}
        columns={salesInvoiceColumns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{
          pageIndex: filters.page - 1,
          pageSize: filters.per_page,
        }}
        onPaginationChange={(state) => {
          updateFilter('page', state.pageIndex + 1)
          updateFilter('per_page', state.pageSize)
        }}
        bulkActions={[
          {
            id: 'bulk-void',
            label: 'Void',
            variant: 'destructive',
            permission: 'sales.invoices.void',
            onClick: handleBulkVoid,
          }
        ]}
        emptyTitle="Belum ada invoice"
        emptyDescription="Buat invoice pertama untuk memulai."
      />
    </WorkspaceLayout>
  )
}
```

---

## Template: Form Page

```typescript
// modules/sales/pages/SalesInvoiceFormPage.tsx

import { useParams } from 'react-router-dom'
import { useSalesInvoice } from '../hooks/useSalesInvoiceList'
import { useDocumentActions } from '@/hooks/useDocumentActions'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { SalesInvoiceForm } from '../components/SalesInvoiceForm'
import { DocumentLockedBanner } from '@/components/shared/document/DocumentLockedBanner'

export default function SalesInvoiceFormPage() {
  const { id } = useParams()
  const isCreate = !id

  const { data, isLoading } = useSalesInvoice(id ? Number(id) : 0)
  const invoice = data?.data

  // Cek dependences dari invoice data
  const hasPostedDependences = !!(
    invoice?.receipts?.some(r => r.status === 'posted') ||
    invoice?.returns?.some(r => r.status === 'posted')
  )

  const { availableActions, editMode } = useDocumentActions(
    invoice ?? { status: 'draft' },
    hasPostedDependences,
    'sales.invoices'
  )

  if (isLoading) return <FormPageSkeleton />

  return (
    <FormLayout
      title={isCreate ? 'Buat Invoice Penjualan' : 'Invoice Penjualan'}
      documentNumber={invoice?.invoice_number}
      status={invoice?.status}
      breadcrumb={[
        { label: 'Penjualan', href: '/sales' },
        { label: 'Invoice', href: '/sales/invoices' },
        { label: isCreate ? 'Buat Baru' : invoice?.invoice_number ?? '' },
      ]}
    >
      {/* Locked banner */}
      {editMode === 'locked' && invoice && (
        <DocumentLockedBanner dependences={buildDependences(invoice)} />
      )}

      {/* Form */}
      <SalesInvoiceForm
        invoice={invoice}
        isReadOnly={editMode !== 'editable'}
        availableActions={availableActions}
      />
    </FormLayout>
  )
}
```

---

## Template: Routes

```typescript
// modules/sales/routes.tsx
import { lazy } from 'react'
import { ProtectedRoute } from '@/router/guards'

const SalesInvoiceListPage = lazy(() => import('./pages/SalesInvoiceListPage'))
const SalesInvoiceFormPage = lazy(() => import('./pages/SalesInvoiceFormPage'))

export const salesRoutes = [
  {
    path: '/sales/invoices',
    element: (
      <ProtectedRoute permission="sales.invoices.view">
        <SalesInvoiceListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sales/invoices/create',
    element: (
      <ProtectedRoute permission="sales.invoices.create">
        <SalesInvoiceFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/sales/invoices/:id',
    element: (
      <ProtectedRoute permission="sales.invoices.view">
        <SalesInvoiceFormPage />
      </ProtectedRoute>
    ),
  },
]
```

---

## Pattern: Source Document (Create From)

Ketika membuat dokumen dari dokumen sumber (misal Invoice dari Sales Order):

```typescript
// Di form page, jika ada query param ?from_order_id=123
const [searchParams] = useSearchParams()
const fromOrderId = searchParams.get('from_order_id')

// Load source document untuk pre-fill form
const { data: sourceOrder } = useSalesOrder(
  fromOrderId ? Number(fromOrderId) : 0
)

// Mutation
const createFromOrder = useMutation({
  mutationFn: (payload: Partial<CreateSalesInvoicePayload>) =>
    salesInvoiceApi.createFromSalesOrder(Number(fromOrderId), payload),
  onSuccess: (response) => {
    toast.success('Invoice berhasil dibuat dari Sales Order.')
    navigate(`/sales/invoices/${response.data.id}`)
  },
})
```

---

## Pattern: AR/AP Summary Pages

```typescript
// modules/sales/pages/AccountsReceivablePage.tsx
// Menggunakan endpoint khusus AR, bukan invoice list biasa

export default function AccountsReceivablePage() {
  // Summary: GET /sales/ar/customer-summary
  const { data: summary } = useQuery({
    queryKey: ['sales-ar-summary'],
    queryFn: () => salesArApi.customerSummary(),
  })

  // Aging: GET /sales/ar/aging
  const { data: aging } = useQuery({
    queryKey: ['sales-ar-aging'],
    queryFn: () => salesArApi.aging(),
  })

  return (
    <WorkspaceLayout title="Piutang Usaha">
      {/* Summary cards */}
      {/* Aging table */}
      {/* Customer ledger link */}
    </WorkspaceLayout>
  )
}
```

---

## Naming Checklist per Modul

Sebelum submit code, pastikan semua nama konsisten:

```
✅ Page: {Entity}ListPage.tsx, {Entity}FormPage.tsx
✅ Hook: use{Entity}List.ts, use{Entity}Form.ts, use{Entity}Mutations.ts  
✅ API:  {entity}Api.ts
✅ Type: {Entity}, {Entity}Status, {Entity}ListParams, Create{Entity}Payload
✅ Schema: create{Entity}Schema.ts, update{Entity}Schema.ts
✅ Route: /{module}/{entities}, /{module}/{entities}/create, /{module}/{entities}/:id
✅ Query key: ['{module}-{entities}'], ['{module}-{entities}', id]
✅ Permission: {module}.{entities}.view|create|approve|post|void
```
