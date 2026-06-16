# Prompt — Phase 10: Fixed Assets Module

**Phase**: 10  
**Estimasi**: 2 sesi  
**Dependencies**: Phase 9 harus selesai  
**Referensi**: `docs/praproduction_docs/spec-28-fixed-assets-module.md`

---

## Tugas

Buat modul Fixed Assets lengkap: list, form, categories, dan 4 halaman report.

**Baca dulu sebelum mulai:**
1. `docs/gap_docs/gap-03-missing-modules.md` §3A — Fixed Assets gap analysis
2. `docs/design_docs/design-N1-fixed-assets-list-form.md` — desain semua halaman
3. `docs/praproduction_docs/spec-28-fixed-assets-module.md` — full spec dengan types & code

---

## Context

Modul Fixed Assets sudah ada di backend (`/fixed-assets/*`) tapi belum ada halaman di frontend sama sekali. Ada juga `fixedAssetCategoryApi.ts` di `src/modules/purchase/services/` yang perlu dipindahkan ke modul baru ini.

---

## File yang Dibuat Baru

```
src/modules/fixed-assets/
  types/
    fixedAsset.types.ts
  services/
    fixedAssetApi.ts
    fixedAssetCategoryApi.ts   ← dipindah dari purchase/services/
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

## File yang Diubah

```
src/modules/purchase/services/fixedAssetCategoryApi.ts     ← hapus setelah dipindah
src/modules/purchase/pages/ProdukFormPage.tsx              ← update import fixedAssetCategoryApi
src/router/index.tsx                                       ← tambah fixedAssetRoutes
src/router/moduleConfig.ts                                 ← tambah ribbonItems Fixed Assets
```

---

## Urutan Pekerjaan

### Step 1 — Types

Buat `fixedAsset.types.ts` dengan:
- `FixedAssetStatus: 'active' | 'disposed' | 'fully_depreciated'`
- `DepreciationMethod: 'straight_line' | 'declining_balance'`
- `FixedAssetCategory`, `FixedAsset`, `FixedAssetPayload`
- `CapitalizePayload`, `DisposePayload`
- `FixedAssetListParams`

Lihat spec-28 §Types untuk definisi lengkap.

### Step 2 — Services

#### `fixedAssetApi.ts`
```ts
export const fixedAssetApi = {
  list:       (params?) → GET /fixed-assets
  get:        (id)      → GET /fixed-assets/{id}
  store:      (payload) → POST /fixed-assets
  update:     (id, p)   → PATCH /fixed-assets/{id}
  capitalize: (id, p)   → POST /fixed-assets/{id}/capitalize
  dispose:    (id, p)   → POST /fixed-assets/{id}/dispose
  reports: {
    register:       (params) → GET /fixed-assets/reports/register
    depreciation:   (params) → GET /fixed-assets/reports/depreciation
    disposals:      (params) → GET /fixed-assets/reports/disposals
    reconciliation: (params) → GET /fixed-assets/reports/reconciliation
  }
}
```

#### `fixedAssetCategoryApi.ts`
Pindahkan dari `purchase/services/` ke sini. Update semua import yang memakai file lama.

### Step 3 — Hooks

#### `useFixedAssetList.ts`
```ts
useFixedAssetList(params?)  // queryKey: ['fixed-assets', params]
useFixedAsset(id?)          // queryKey: ['fixed-assets', id], enabled: !!id
```

#### `useFixedAssetMutations.ts`
```ts
useFixedAssetMutations() → { create, update, capitalize, dispose }
```

#### `useFixedAssetCategories.ts`
```ts
useFixedAssetCategories()        // queryKey: ['fixed-asset-categories']
useFixedAssetCategoryMutations() // { create, update }
```

### Step 4 — FixedAssetListPage.tsx

- FilterSidebar: category (SearchableSelect dari fixedAssetCategoryApi), status (Select)
- DataTable columns: code (sticky, link ke /fixed-assets/{id}), name, category, acquisition_date, acquisition_cost, accumulated_depreciation, book_value, status badge
- Header action: [+ Tambah Aktiva] dengan `PermissionGuard permission="fixed_assets.create"`
- Empty state jika tidak ada data

### Step 5 — FixedAssetFormPage.tsx

**Route**: `/fixed-assets/create` (create) dan `/fixed-assets/:id` (view/edit)

**4 FormSection**:
1. **Informasi Dasar**: code, name, description, category_id (SearchableSelect), vendor_id (SearchableSelect kontak), po_reference
2. **Perolehan**: acquisition_date (DatePicker), acquisition_cost (number input)
3. **Depresiasi**: depreciation_method (Select), useful_life_months, salvage_value, depreciation_start_date
4. **Akun**: asset_account_id, depreciation_account_id, accumulated_account_id, gain_loss_account_id (semua SearchableSelect COA)

**Info saldo (view mode, read-only)**: book_value, accumulated_depreciation, remaining_life_months, monthly_depreciation

**Action buttons berdasarkan status**:
- `active` → tombol Edit + Dialog Kapitalisasi + Dialog Pelepasan
- `disposed` → semua field read-only
- `fully_depreciated` → tombol Dialog Pelepasan saja

**Dialog Kapitalisasi** (CapitalizePayload):
- capitalize_date (DatePicker), description (textarea)
- Submit → POST /fixed-assets/{id}/capitalize

**Dialog Pelepasan** (DisposePayload):
- dispose_date, method (Select: sold/scrapped/donated), sale_price (conditional if sold), buyer (conditional if sold), description
- Submit → POST /fixed-assets/{id}/dispose

### Step 6 — FixedAssetCategoryPage.tsx

- Pola seperti `SatuanPage.tsx` — list + dialog form
- DataTable: code, name, default_depreciation_method, default_useful_life_months
- Dialog: code, name, default_depreciation_method, default_useful_life_months, default_asset_account (SearchableSelect COA), default_accumulated_account

### Step 7 — Report Pages (4 halaman)

Ikuti pola `TrialBalancePage.tsx`:
- Filter params → `activeParams` state
- `enabled: !!activeParams`
- Tidak ada tombol Export (backend belum ada endpoint)

**FixedAssetRegisterPage** — parameter: as_of_date, category_id (optional)  
**FixedAssetDepreciationPage** — parameter: period (YYYY-MM), category_id (optional)  
**FixedAssetDisposalsPage** — parameter: date_from, date_to  
**FixedAssetReconPage** — parameter: date_from, date_to

### Step 8 — Routes

```tsx
// src/modules/fixed-assets/routes.tsx
/fixed-assets                       → FixedAssetListPage       permission: fixed_assets.view
/fixed-assets/categories            → FixedAssetCategoryPage   permission: fixed_assets.settings.view
/fixed-assets/create                → FixedAssetFormPage       permission: fixed_assets.create
/fixed-assets/:id                   → FixedAssetFormPage       permission: fixed_assets.view
/fixed-assets/reports/register      → FixedAssetRegisterPage   permission: fixed_assets.reports.view
/fixed-assets/reports/depreciation  → FixedAssetDepreciationPage
/fixed-assets/reports/disposals     → FixedAssetDisposalsPage
/fixed-assets/reports/reconciliation → FixedAssetReconPage
```

### Step 9 — Router & ModuleConfig

Di `src/router/index.tsx`: import `fixedAssetRoutes` dan spread ke routes array.

Di `src/router/moduleConfig.ts` — Fixed Assets module ribbonItems:
```ts
ribbonItems: [
  { id: 'fixed-assets-list', label: 'Aktiva Tetap', icon: Building2, path: '/fixed-assets', permission: 'fixed_assets.view' },
  { id: 'fa-categories', label: 'Kategori', icon: Tag, path: '/fixed-assets/categories', permission: 'fixed_assets.settings.view' },
  { id: 'fa-register', label: 'Daftar Aktiva', icon: FileText, path: '/fixed-assets/reports/register', permission: 'fixed_assets.reports.view' },
  { id: 'fa-depreciation', label: 'Depresiasi', icon: TrendingDown, path: '/fixed-assets/reports/depreciation', permission: 'fixed_assets.reports.view' },
  { id: 'fa-disposals', label: 'Pelepasan', icon: Trash2, path: '/fixed-assets/reports/disposals', permission: 'fixed_assets.reports.view' },
]
```

Pastikan import icon baru ditambahkan: `Building2`, `Tag`, `TrendingDown`.

### Step 10 — Verify Build & Commit

```bash
cd /workspace/frontend
npm run build   # harus 0 error
rtk git add src/modules/fixed-assets/
rtk git add src/router/index.tsx src/router/moduleConfig.ts
rtk git commit -m "feat(fixed-assets): phase 10 — fixed assets module"
rtk git push
```

---

## Hal yang Harus Diperhatikan

1. **SearchableSelect COA** — pakai `coaApi.search(q)` yang sudah return `SelectOption[]` langsung (tidak perlu `.then(r => r.data)`)
2. **PermissionGuard** — wrap semua tombol aksi (Tambah, Edit, Kapitalisasi, Pelepasan)
3. **DataTable import** — dari `@/components/shared/table/DataTable`, bukan `@tanstack/react-table`
4. **FormLayout** untuk form pages, `WorkspaceLayout` untuk list pages
5. **Zod**: gunakan `z.number()` + `valueAsNumber: true` untuk field angka, bukan `z.coerce.number()`
6. **Update docs/struktur_frontend.md** setelah semua file dibuat
