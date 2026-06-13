# 11 — Permission Rules

## Sumber Permission

Permission user disimpan di auth store setelah login:

```typescript
// stores/useAuthStore.ts
interface AuthState {
  token: string | null
  user: User | null
  permissions: string[]     // ['sales.invoices.view', 'sales.invoices.create', ...]
  companies: Company[]
}
```

Permission di-load dari `GET /auth/me` dan disimpan ke store.

---

## Format Permission String

```
{module}.{resource}.{action}

Contoh:
  sales.invoices.view
  sales.invoices.create
  sales.invoices.approve
  sales.invoices.post
  sales.invoices.void
  purchase.bills.view
  inventory.stock.view
  reports.view
  master-data.contacts.create
```

---

## Hook: usePermission

```typescript
// hooks/usePermission.ts
export function usePermission() {
  const { permissions } = useAuthStore()

  return {
    // Cek satu permission
    can: (permission: string): boolean =>
      permissions.includes(permission),

    // Cek jika punya salah satu dari beberapa permission
    canAny: (perms: string[]): boolean =>
      perms.some(p => permissions.includes(p)),

    // Cek jika punya semua permission
    canAll: (perms: string[]): boolean =>
      perms.every(p => permissions.includes(p)),
  }
}
```

---

## PermissionGuard Component

```typescript
// components/shared/PermissionGuard.tsx

interface PermissionGuardProps {
  permission: string | string[]
  mode?: 'any' | 'all'      // Default: 'any'
  fallback?: React.ReactNode  // Default: null (tidak render apapun)
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  mode = 'any',
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, canAny, canAll } = usePermission()

  const hasPermission = Array.isArray(permission)
    ? mode === 'all' ? canAll(permission) : canAny(permission)
    : can(permission)

  if (!hasPermission) return <>{fallback}</>
  return <>{children}</>
}
```

### Penggunaan

```tsx
// Sembunyikan tombol jika tidak punya permission
<PermissionGuard permission="sales.invoices.post">
  <Button onClick={handlePost}>Post Invoice</Button>
</PermissionGuard>

// Tampilkan fallback jika tidak punya permission
<PermissionGuard
  permission="reports.view"
  fallback={<AccessDeniedMessage />}
>
  <ReportsPage />
</PermissionGuard>

// Multiple permissions (any)
<PermissionGuard permission={['sales.invoices.approve', 'sales.invoices.post']}>
  <ApproveButton />
</PermissionGuard>
```

---

## Route Guard

```typescript
// router/guards.tsx
export function ProtectedRoute({
  permission,
  children,
}: {
  permission?: string
  children: React.ReactNode
}) {
  const { token, permissions } = useAuthStore()
  const location = useLocation()

  // Belum login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Tidak punya permission
  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
```

### Route Definition

```typescript
// router/index.tsx
<Route
  path="/sales/invoices"
  element={
    <ProtectedRoute permission="sales.invoices.view">
      <SalesInvoiceListPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/sales/invoices/create"
  element={
    <ProtectedRoute permission="sales.invoices.create">
      <SalesInvoiceFormPage />
    </ProtectedRoute>
  }
/>
```

---

## Ribbon Item Permission

Ribbon item hanya tampil jika user punya permission view untuk resource tersebut:

```typescript
// Definisi ribbon item dengan permission
const salesRibbonItems: RibbonItem[] = [
  {
    id: 'quotations',
    label: 'Penawaran',
    icon: FileText,
    path: '/sales/quotations',
    permission: 'sales.quotations.view',
  },
  {
    id: 'orders',
    label: 'Sales Order',
    icon: ShoppingCart,
    path: '/sales/orders',
    permission: 'sales.orders.view',
  },
  {
    id: 'invoices',
    label: 'Invoice',
    icon: Receipt,
    path: '/sales/invoices',
    permission: 'sales.invoices.view',
  },
  // ...
]

// RibbonPanel hanya render item yang user punya permission-nya
const visibleItems = ribbonItems.filter(item =>
  !item.permission || can(item.permission)
)
```

---

## Action Button Permission

Selalu wrap action button dengan PermissionGuard:

```tsx
// Fixed bottom bar
<div className="flex gap-3">
  {/* Save draft — permission: create */}
  <PermissionGuard permission={`${module}.${resource}.create`}>
    <Button variant="outline" onClick={handleSaveDraft}>
      Simpan Draft
    </Button>
  </PermissionGuard>

  {/* Approve */}
  <PermissionGuard permission={`${module}.${resource}.approve`}>
    <Button variant="secondary" onClick={handleApprove}>
      Approve
    </Button>
  </PermissionGuard>

  {/* Post */}
  <PermissionGuard permission={`${module}.${resource}.post`}>
    <Button variant="default" onClick={handlePost}>
      Post
    </Button>
  </PermissionGuard>

  {/* Void — hanya jika posted dan tidak locked */}
  {document.status === 'posted' && !isLocked && (
    <PermissionGuard permission={`${module}.${resource}.void`}>
      <Button variant="destructive" onClick={handleVoidClick}>
        Void
      </Button>
    </PermissionGuard>
  )}
</div>
```

---

## Tombol Disabled vs Tersembunyi

| Kondisi | Behavior |
|---|---|
| Tidak punya permission | **TERSEMBUNYI** (tidak di-render) |
| Punya permission tapi kondisi tidak memenuhi | **DISABLED** dengan tooltip |

Contoh disabled dengan tooltip:
```tsx
// Invoice sudah paid — void disabled
<Tooltip content="Invoice ini tidak dapat di-void karena sudah ada pembayaran.">
  <span> {/* Wrapper untuk tooltip pada disabled button */}
    <Button variant="destructive" disabled>
      Void
    </Button>
  </span>
</Tooltip>
```

---

## Permission untuk Bulk Actions

```typescript
// Bulk void di list page
const bulkActions: BulkAction[] = [
  {
    id: 'bulk-void',
    label: 'Void',
    icon: Ban,
    variant: 'destructive',
    permission: 'sales.invoices.void',
    onClick: (selectedIds) => handleBulkVoid(selectedIds),
  },
]

// BulkActionBar filter berdasarkan permission
const visibleBulkActions = bulkActions.filter(action =>
  can(action.permission)
)
```

---

## Permission Reference per Module

### Sales
```
sales.quotations.view | create | edit | approve | cancel
sales.orders.view | create | approve | confirm | cancel | convert
sales.delivery-orders.view | create | ship | deliver | cancel | void
sales.invoices.view | create | approve | post | void
sales.receipts.view | create | post | void
sales.returns.view | create | approve | post | void
sales.deposits.view | create | post | void | refund
sales.ar.view | reconcile
```

### Purchase
```
purchase.requests.view | create | edit | approve | cancel
purchase.orders.view | create | approve | confirm | cancel | convert
purchase.goods-receipts.view | create | receive | cancel | void
purchase.bills.view | create | approve | post | void
purchase.payments.view | create | post | void
purchase.returns.view | create | approve | post | void
purchase.deposits.view | create | post | void | refund
purchase.ap.view | reconcile
```

### Inventory
```
inventory.stock.view
inventory.movements.view | create | post | void
inventory.adjustments.view | create | edit | approve | post | void
inventory.opnames.view | create | edit | finalize | void
inventory.reports.view
inventory.valuation.view
```

### Accounting & Reports
```
journal.view | create | approve | post | void
accounting.fiscal-years.manage
accounting.period-locks.manage
reports.view
cash_bank.view | create | post | void
master-data.view | create | edit
```
