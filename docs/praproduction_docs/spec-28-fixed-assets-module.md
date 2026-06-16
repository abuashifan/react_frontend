# Spec-28 — Phase 10: Fixed Assets Module

**Phase**: 10  
**Tipe**: Modul baru  
**Estimasi**: 2 sesi  
**Referensi**: gap-03 §3A, design-N1

---

## Folder Structure

```
src/modules/fixed-assets/
  types/
    fixedAsset.types.ts
  services/
    fixedAssetApi.ts
    fixedAssetCategoryApi.ts   ← pindah dari purchase/services/fixedAssetCategoryApi.ts
  hooks/
    useFixedAssetList.ts
    useFixedAssetMutations.ts
    useFixedAssetCategories.ts
  pages/
    FixedAssetListPage.tsx
    FixedAssetFormPage.tsx
    FixedAssetCategoryPage.tsx
    reports/
      FixedAssetRegisterPage.tsx
      FixedAssetDepreciationPage.tsx
      FixedAssetDisposalsPage.tsx
      FixedAssetReconPage.tsx
  routes.tsx
```

---

## Types (`fixedAsset.types.ts`)

```ts
export type FixedAssetStatus = 'active' | 'disposed' | 'fully_depreciated'
export type DepreciationMethod = 'straight_line' | 'declining_balance'

export interface FixedAssetCategory {
  id: number
  code: string
  name: string
  default_depreciation_method?: DepreciationMethod | null
  default_useful_life_months?: number | null
  default_asset_account_id?: number | null
  default_accumulated_account_id?: number | null
}

export interface FixedAsset {
  id: number
  code: string
  name: string
  description?: string | null
  category_id: number
  category?: FixedAssetCategory
  acquisition_date: string
  acquisition_cost: number
  vendor_id?: number | null
  po_reference?: string | null
  depreciation_method: DepreciationMethod
  useful_life_months: number
  salvage_value: number
  depreciation_start_date?: string | null
  asset_account_id: number
  depreciation_account_id: number
  accumulated_account_id: number
  gain_loss_account_id?: number | null
  book_value: number
  accumulated_depreciation: number
  remaining_life_months?: number | null
  monthly_depreciation?: number | null
  status: FixedAssetStatus
  created_at: string
}

export interface FixedAssetPayload {
  code: string
  name: string
  description?: string
  category_id: number
  acquisition_date: string
  acquisition_cost: number
  vendor_id?: number | null
  po_reference?: string | null
  depreciation_method: DepreciationMethod
  useful_life_months: number
  salvage_value?: number
  depreciation_start_date?: string | null
  asset_account_id: number
  depreciation_account_id: number
  accumulated_account_id: number
  gain_loss_account_id?: number | null
}

export interface CapitalizePayload {
  capitalize_date: string
  description?: string
}

export interface DisposePayload {
  dispose_date: string
  method: 'sold' | 'scrapped' | 'donated'
  sale_price?: number
  buyer?: string
  description?: string
}

export interface FixedAssetListParams {
  page?: number
  per_page?: number
  search?: string
  category_id?: number
  status?: FixedAssetStatus
}
```

---

## Services

### `fixedAssetApi.ts`

```ts
export const fixedAssetApi = {
  list:       (params?: FixedAssetListParams)  → GET /fixed-assets
  get:        (id: number)                      → GET /fixed-assets/{id}
  store:      (payload: FixedAssetPayload)      → POST /fixed-assets
  update:     (id, payload)                     → PATCH /fixed-assets/{id}
  capitalize: (id, payload: CapitalizePayload)  → POST /fixed-assets/{id}/capitalize
  dispose:    (id, payload: DisposePayload)     → POST /fixed-assets/{id}/dispose
  reports: {
    register:       (params) → GET /fixed-assets/reports/register
    depreciation:   (params) → GET /fixed-assets/reports/depreciation
    disposals:      (params) → GET /fixed-assets/reports/disposals
    reconciliation: (params) → GET /fixed-assets/reports/reconciliation
  }
}
```

### `fixedAssetCategoryApi.ts`

```ts
export const fixedAssetCategoryApi = {
  list:   (params?)  → GET /fixed-assets/categories
  store:  (payload)  → POST /fixed-assets/categories
  update: (id, payload) → PATCH /fixed-assets/categories/{id}
  search: async (query) → filter dari list, return SelectOption[]
}
```

**Note**: Hapus `purchase/services/fixedAssetCategoryApi.ts` setelah dipindah. Update import di `ProdukFormPage.tsx` dan `VendorBillFormPage.tsx`.

---

## Hooks

### `useFixedAssetList.ts`

```ts
export function useFixedAssetList(params?: FixedAssetListParams)
// useQuery: queryKey ['fixed-assets', params]

export function useFixedAsset(id?: number)
// useQuery: queryKey ['fixed-assets', id], enabled: !!id
```

### `useFixedAssetMutations.ts`

```ts
export function useFixedAssetMutations() {
  return {
    create:     useMutation → fixedAssetApi.store
    update:     useMutation → fixedAssetApi.update
    capitalize: useMutation → fixedAssetApi.capitalize
    dispose:    useMutation → fixedAssetApi.dispose
  }
}
```

### `useFixedAssetCategories.ts`

```ts
export function useFixedAssetCategories()
// useQuery: queryKey ['fixed-asset-categories']

export function useFixedAssetCategoryMutations() {
  return { create: ..., update: ... }
}
```

---

## Pages

### `FixedAssetListPage.tsx`

- FilterSidebar: category (SearchableSelect), status (Select)
- DataTable: code (sticky, link), name, category, acquisition_date, acquisition_cost, accumulated_depreciation, book_value, status badge
- Action: [+ Tambah Aktiva] permission: `fixed_assets.create`

### `FixedAssetFormPage.tsx`

- FormLayout dengan 4 FormSection: Informasi Dasar, Perolehan, Depresiasi, Akun
- Create mode: form kosong
- View/Edit mode: semua field + info saldo buku (read-only)
- Tombol aksi berdasarkan status:
  - `active` → [Edit] [Kapitalisasi] [Lepas/Jual]
  - `disposed` → read-only
  - `fully_depreciated` → [Lepas/Jual]
- Dialog Kapitalisasi: date + description
- Dialog Pelepasan: date, method, sale_price (conditional), buyer, description

### `FixedAssetCategoryPage.tsx`

- Dialog-based CRUD (pola seperti SatuanPage)
- DataTable: code, name, default_depreciation_method, default_useful_life_months
- Dialog form: code, name, default_depreciation_method, default_useful_life_months, default_asset_account (SearchableSelect COA), default_accumulated_account

### Report Pages

Semua ikuti pola `TrialBalancePage`:
- `ReportFilterParameter` + `ReportCompactBar`
- `enabled: !!activeParams`
- Tidak ada tombol export (backend belum ada)

---

## Routes (`routes.tsx`)

```tsx
/fixed-assets                       → FixedAssetListPage       permission: fixed_assets.view
/fixed-assets/categories            → FixedAssetCategoryPage    permission: fixed_assets.settings.view
/fixed-assets/create                → FixedAssetFormPage        permission: fixed_assets.create
/fixed-assets/:id                   → FixedAssetFormPage        permission: fixed_assets.view
/fixed-assets/reports/register      → FixedAssetRegisterPage    permission: fixed_assets.reports.view
/fixed-assets/reports/depreciation  → FixedAssetDepreciationPage permission: fixed_assets.reports.view
/fixed-assets/reports/disposals     → FixedAssetDisposalsPage   permission: fixed_assets.reports.view
/fixed-assets/reports/reconciliation → FixedAssetReconPage      permission: fixed_assets.reports.view
```

---

## moduleConfig.ts Update

```ts
// Fixed Assets ribbonItems — ganti dari [] ke:
ribbonItems: [
  { id: 'fixed-assets-list',   label: 'Aktiva Tetap',  icon: Building2,   path: '/fixed-assets',                       permission: 'fixed_assets.view' },
  { id: 'fa-categories',       label: 'Kategori',       icon: Tag,         path: '/fixed-assets/categories',            permission: 'fixed_assets.settings.view' },
  { id: 'fa-register',         label: 'Daftar Aktiva',  icon: FileText,    path: '/fixed-assets/reports/register',      permission: 'fixed_assets.reports.view' },
  { id: 'fa-depreciation',     label: 'Depresiasi',     icon: TrendingDown,path: '/fixed-assets/reports/depreciation',  permission: 'fixed_assets.reports.view' },
  { id: 'fa-disposals',        label: 'Pelepasan',      icon: Trash2,      path: '/fixed-assets/reports/disposals',     permission: 'fixed_assets.reports.view' },
]
```

## router/index.tsx Update

```tsx
import { fixedAssetRoutes } from '@/modules/fixed-assets/routes'
// ...spread di dalam router array
...fixedAssetRoutes,
```

---

## Build & Commit

```bash
npm run build   # harus 0 error
git commit -m "feat(fixed-assets): phase 10 — fixed assets module"
git push
```
