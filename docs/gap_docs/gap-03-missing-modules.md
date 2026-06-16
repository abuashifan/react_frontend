# GAP-03 — Module Baru yang Belum Ada di Frontend

**Severity**: 🔴 High  
**Modul**: Fixed Assets, Opening Balance, Period-End Processing

---

## 3A. Fixed Assets

### Backend endpoints tersedia

```
GET    /fixed-assets/categories           permission: fixed_assets.settings.view
POST   /fixed-assets/categories           permission: fixed_assets.settings.manage
PATCH  /fixed-assets/categories/{id}      permission: fixed_assets.settings.manage

GET    /fixed-assets                       permission: fixed_assets.view
POST   /fixed-assets                       permission: fixed_assets.create
GET    /fixed-assets/{id}                  permission: fixed_assets.view
PATCH  /fixed-assets/{id}                  permission: fixed_assets.edit
POST   /fixed-assets/{id}/capitalize       permission: fixed_assets.capitalize
POST   /fixed-assets/{id}/dispose          permission: fixed_assets.dispose

GET    /fixed-assets/reports/register      permission: fixed_assets.reports.view
GET    /fixed-assets/reports/depreciation  permission: fixed_assets.reports.view
GET    /fixed-assets/reports/disposals     permission: fixed_assets.reports.view
GET    /fixed-assets/reports/reconciliation permission: fixed_assets.reports.view
```

### Yang perlu dibuat di frontend

```
src/modules/fixed-assets/
  types/
    fixedAsset.types.ts       — FixedAsset, FixedAssetCategory, CapitalizePayload, DisposePayload
  services/
    fixedAssetApi.ts          — semua endpoint di atas
    fixedAssetCategoryApi.ts  — categories CRUD (sudah ada parsial di purchase, perlu move)
  hooks/
    useFixedAssetList.ts
    useFixedAssetMutations.ts
    useFixedAssetCategories.ts
  pages/
    FixedAssetListPage.tsx    — list dengan filter category/status
    FixedAssetFormPage.tsx    — create/edit form; capitalize & dispose actions
    FixedAssetCategoryPage.tsx — CRUD kategori (dialog-based)
    FixedAssetRegisterPage.tsx      — /reports/register
    FixedAssetDepreciationPage.tsx  — /reports/depreciation
    FixedAssetDisposalsPage.tsx     — /reports/disposals
    FixedAssetReconPage.tsx         — /reports/reconciliation
  routes.tsx
```

### Ribbon items yang perlu ditambahkan

```ts
{ id: 'fixed-assets', label: 'Aktiva Tetap', icon: Building2, path: '/fixed-assets', permission: 'fixed_assets.view' },
{ id: 'fa-categories', label: 'Kategori', icon: Tags, path: '/fixed-assets/categories', permission: 'fixed_assets.settings.view' },
{ id: 'fa-register', label: 'Daftar Aktiva', icon: FileText, path: '/fixed-assets/reports/register', permission: 'fixed_assets.reports.view' },
{ id: 'fa-depreciation', label: 'Depresiasi', icon: TrendingDown, path: '/fixed-assets/reports/depreciation', permission: 'fixed_assets.reports.view' },
{ id: 'fa-disposals', label: 'Pelepasan', icon: Trash2, path: '/fixed-assets/reports/disposals', permission: 'fixed_assets.reports.view' },
```

---

## 3B. Opening Balance

### Backend endpoints tersedia

```
GET    /opening-balance/status             permission: opening_balance.view
GET    /opening-balance/batches            permission: opening_balance.view
POST   /opening-balance/batches            permission: opening_balance.manage
GET    /opening-balance/batches/{batch}    permission: opening_balance.view
PATCH  /opening-balance/batches/{batch}    permission: opening_balance.manage
PUT    /opening-balance/batches/{batch}/lines        permission: opening_balance.manage
POST   /opening-balance/batches/{batch}/validate     permission: opening_balance.validate
GET    /opening-balance/batches/{batch}/preview      permission: opening_balance.view
POST   /opening-balance/batches/{batch}/post         permission: opening_balance.post
POST   /opening-balance/batches/{batch}/lock         permission: opening_balance.lock
POST   /opening-balance/batches/{batch}/reopen       permission: opening_balance.reopen
```

### Yang perlu dibuat di frontend

```
src/modules/opening-balance/
  types/
    openingBalance.types.ts   — OBStatus, OBBatch, OBLine
  services/
    openingBalanceApi.ts
  hooks/
    useOpeningBalance.ts
  pages/
    OpeningBalanceStatusPage.tsx  — status + link ke batch aktif
    OpeningBalanceBatchPage.tsx   — line editor, validate, preview, post, lock, reopen
  routes.tsx
```

### Keterkaitan dengan Onboarding

`onboardingApi.saveOpeningBalance()` saat ini memanggil `POST /accounting/opening-balances` (endpoint lama yang tidak ada).  
Harus diganti ke `POST /opening-balance/batches` + `PUT /opening-balance/batches/{batch}/lines`.

---

## 3C. Period-End Processing

### Backend endpoints tersedia

```
GET    /accounting/period-end/status    permission: period_end.view
GET    /accounting/period-end/checklist permission: period_end.view
POST   /accounting/period-end/run       permission: period_end.run
POST   /accounting/period-end/reopen    permission: period_end.reopen
```

### Yang perlu dibuat di frontend

```
src/modules/accounting/pages/PeriodEndPage.tsx
src/modules/accounting/services/  — tambahkan periodEndApi ke accountingApi atau file baru
src/modules/accounting/hooks/     — usePeriodEnd hook
```

### Tambahkan ke ribbon Accounting

```ts
{ id: 'period-end', label: 'Akhir Periode', icon: CheckCircle, path: '/accounting/period-end', permission: 'period_end.view' }
```

### Notes

- Month selector: `YYYY-MM` format (bukan date picker bebas)
- Checklist menampilkan item apa saja yang sudah/belum selesai sebelum close period
- `POST /run` menjalankan semua proses akhir periode: depresiasi, accrual, dll
- `POST /reopen` membuka kembali periode yang sudah ditutup
