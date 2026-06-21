# 03 — Folder Structure

## Struktur Lengkap

```
seaside-erp/
├── public/
│   └── fonts/                    ← Inter font files
├── src/
│   ├── modules/                  ← Semua fitur bisnis
│   │   ├── sales/
│   │   │   ├── pages/            ← Page components
│   │   │   ├── components/       ← Feature-specific components
│   │   │   ├── services/         ← API calls (salesInvoiceApi.ts)
│   │   │   ├── hooks/            ← Feature-specific hooks
│   │   │   ├── types/            ← TypeScript types
│   │   │   ├── schemas/          ← Zod schemas
│   │   │   └── routes.tsx        ← Route definitions modul ini
│   │   ├── purchase/
│   │   ├── inventory/
│   │   ├── accounting/
│   │   ├── cash-bank/
│   │   ├── reports/
│   │   └── master-data/
│   │
│   ├── components/
│   │   ├── ui/                   ← Shadcn/ui base components (JANGAN EDIT)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   └── shared/               ← Shared business components
│   │       ├── layout/
│   │       │   ├── AppShell.tsx          ← Root layout
│   │       │   ├── Topbar.tsx            ← Module tabs
│   │       │   ├── RibbonPanel.tsx       ← Ribbon menu
│   │       │   └── FilterSidebar.tsx     ← Filter panel
│   │       ├── document/
│   │       │   ├── DocumentStatusBadge.tsx
│   │       │   ├── DocumentLockedBanner.tsx
│   │       │   ├── DocumentActionBar.tsx  ← Fixed bottom bar
│   │       │   └── VoidConfirmDialog.tsx
│   │       ├── table/
│   │       │   ├── DataTable.tsx          ← Base table semua list
│   │       │   ├── TablePagination.tsx
│   │       │   └── BulkActionBar.tsx
│   │       ├── form/
│   │       │   ├── FormSection.tsx        ← Section wrapper 2-col grid
│   │       │   ├── LineItemsTable.tsx     ← Line items base
│   │       │   ├── FormSummary.tsx        ← Total section
│   │       │   └── SearchableSelect.tsx   ← Dropdown searchable picker
│   │       └── feedback/
│   │           ├── ToastProvider.tsx
│   │           └── EmptyState.tsx
│   │
│   ├── stores/                   ← Zustand stores (UI state only)
│   │   ├── useAuthStore.ts       ← Token, user, permissions
│   │   ├── useCompanyStore.ts    ← Active company, settings
│   │   └── useUIStore.ts         ← Ribbon state, sidebar state
│   │
│   ├── services/                 ← HTTP layer
│   │   └── http.ts               ← Axios instance + interceptors
│   │
│   ├── hooks/                    ← Global custom hooks
│   │   ├── usePermission.ts
│   │   ├── useDocumentStatus.ts
│   │   └── useCompanySettings.ts
│   │
│   ├── types/                    ← Global TypeScript types
│   │   ├── api.types.ts          ← ApiResponse<T>, PaginatedResponse<T>
│   │   ├── auth.types.ts
│   │   └── common.types.ts
│   │
│   ├── lib/                      ← Utilities
│   │   ├── utils.ts              ← cn(), formatCurrency(), formatDate()
│   │   └── constants.ts          ← App-wide constants
│   │
│   ├── router/
│   │   ├── index.tsx             ← Root router
│   │   └── guards.tsx            ← Auth & permission guards
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── docs/
│   ├── CLAUDE.md
│   ├── 01-project-context.md
│   ├── ...
│   └── backend/                  ← Dokumentasi referensi; source backend aktual ada di /workspace/laravel_backend
│       ├── frontend-api-contract.md
│       ├── 02-api-route-map.md
│       └── ...
├── .env
├── .env.example
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Aturan Folder

### modules/{module}/pages/
- Satu file per halaman
- Naming: `{Entity}ListPage.tsx`, `{Entity}FormPage.tsx`, `{Entity}DetailPage.tsx`
- Page component HANYA berisi: layout, data fetching via hook, render child components
- **DILARANG** ada business logic di page component

```typescript
// BENAR — page hanya orchestrate
export function SalesInvoiceListPage() {
  const { data, isLoading } = useSalesInvoiceList()
  return (
    <WorkspaceLayout>
      <FilterSidebar filters={salesInvoiceFilters} />
      <DataTable data={data} columns={columns} isLoading={isLoading} />
    </WorkspaceLayout>
  )
}
```

### modules/{module}/services/
- Satu file per resource: `salesInvoiceApi.ts`, `salesOrderApi.ts`
- Semua fungsi pure — hanya Axios call, tidak ada logic
- Semua parameter dan return value wajib typed

### modules/{module}/hooks/
- Custom hooks yang mix TanStack Query + business logic
- Naming: `useSalesInvoiceList.ts`, `useSalesInvoiceForm.ts`

```typescript
// Hook menggabungkan query + derived state
export function useSalesInvoiceList(filters: InvoiceFilters) {
  return useQuery({
    queryKey: ['sales-invoices', filters],
    queryFn: () => salesInvoiceApi.list(filters),
  })
}
```

### modules/{module}/schemas/
- Satu file per form: `createSalesInvoiceSchema.ts`
- Semua Zod schema di sini, tidak di komponen

### components/shared/
- Komponen yang dipakai lebih dari satu modul
- Jika komponen hanya dipakai satu modul, tetap di `modules/{module}/components/`
- Jika mulai dipakai modul kedua — **wajib dipindah ke shared**

---

## Path Alias

```typescript
// tsconfig.json & vite.config.ts
{
  "@/*": ["./src/*"]
}

// Penggunaan
import { http } from '@/services/http'
import { usePermission } from '@/hooks/usePermission'
import { DataTable } from '@/components/shared/table/DataTable'
```

**DILARANG** menggunakan relative path lebih dari 2 level (`../../..`).
