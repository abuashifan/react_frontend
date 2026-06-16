# Spec-26 — Phase 8: P0 Contract Fixes

**Phase**: 8  
**Tipe**: Bug fixes — tidak ada fitur baru, hanya perbaikan kontrak  
**Estimasi**: 1 sesi  
**Referensi issue**: issue-01, issue-02, issue-03, issue-04, issue-06

---

## Scope

Fix semua ketidakcocokan kontrak yang menyebabkan fitur yang sudah ada gagal dipakai:
1. Permission key mismatch di seluruh aplikasi
2. Ribbon path salah (3 item)
3. Fiscal Year HTTP method salah (4 endpoint)
4. Bank Reconciliation HTTP method salah + endpoint tidak ada
5. Report: AR/AP aging endpoint salah, export disable, journal approve

---

## Urutan Implementasi

### Step 1: Ribbon paths (5 menit)

File: `src/router/moduleConfig.ts`

```ts
// Ubah:
'/master-data/chart-of-accounts' → '/master-data/coa'
'/cash-bank/transfers'           → '/cash-bank/bank-transfers'
'/cash-bank/reconciliations'     → '/cash-bank/bank-reconciliations'
```

### Step 2: Permission keys — Master Data (20 menit)

Files:
- `src/router/moduleConfig.ts` — ribbonItems permission per resource
- `src/modules/master-data/routes.tsx` — ProtectedRoute permission per route
- Semua pages master-data: ganti PermissionGuard dari `master-data.*` ke resource-specific

Permission mapping:
```
coa.*               → coa.view / coa.create / coa.edit / coa.deactivate
contacts.*          → contacts.view / contacts.create / contacts.edit / contacts.deactivate
payment_terms.*     → payment_terms.view / payment_terms.create / payment_terms.edit
units.*             → units.view / units.create / units.edit
products.*          → products.view / products.create / products.edit / products.deactivate
warehouses.*        → warehouses.view / warehouses.create / warehouses.edit
departments.*       → departments.view / departments.create / departments.edit
projects.*          → projects.view / projects.create / projects.edit
account-mappings    → settings.company.view (read) / settings.company.edit (write)
```

### Step 3: Permission keys — Sales, Purchase, Inventory (15 menit)

```
sales.delivery-orders.*  → sales.delivery_orders.*  (dash → underscore)
purchase.goods-receipts.* → purchase.goods_receipts.* (dash → underscore)
inventory.opnames.*       → inventory.opname.*  (hilangkan 's')
```

Files:
- `src/modules/sales/routes.tsx`
- `src/modules/sales/pages/DeliveryOrderListPage.tsx`
- `src/modules/sales/pages/DeliveryOrderFormPage.tsx`
- `src/modules/purchase/routes.tsx`
- `src/modules/purchase/pages/GoodsReceiptListPage.tsx`
- `src/modules/purchase/pages/GoodsReceiptFormPage.tsx`
- `src/modules/inventory/routes.tsx`
- `src/modules/inventory/pages/StockOpnameListPage.tsx`
- `src/modules/inventory/pages/StockOpnameFormPage.tsx`

### Step 4: Permission keys — Accounting (10 menit)

```
accounting.fiscal-years.manage → fiscal_year.view (untuk list/view)
                               → fiscal_year.close (untuk tombol close)
                               → fiscal_year.reopen (untuk tombol reopen)
                               → fiscal_year.closing_wizard (untuk checklist)
accounting.period-locks.manage → fiscal_year.lock_manage
```

Files:
- `src/modules/accounting/routes.tsx`
- `src/modules/accounting/pages/FiscalYearPage.tsx`
- `src/modules/accounting/pages/PeriodLockPage.tsx`
- `src/router/moduleConfig.ts`

### Step 5: Fiscal Year HTTP methods (20 menit)

File: `src/modules/accounting/services/fiscalYearApi.ts`
```
preview:   PATCH → GET
checklist: PATCH → GET
close:     PATCH → POST
reopen:    PATCH → POST
```

File: `src/modules/accounting/hooks/useFiscalYear.ts`
```
preview dan checklist: ubah dari useMutation → useQuery
```

File: `src/modules/accounting/pages/FiscalYearPage.tsx`
```
Sesuaikan penggunaan: preview/checklist sekarang dari useQuery (data, isLoading)
bukan dari mutation.mutate()
```

### Step 6: Bank Reconciliation HTTP methods (15 menit)

File: `src/modules/cash-bank/services/cashBankApi.ts`
```
refreshLines: PATCH → POST
markLines:    PATCH → POST
Hapus: finalize (tidak ada di backend)
Tambah: update (PATCH /{id}) untuk update statement fields
```

File: `src/modules/cash-bank/hooks/useCashBankList.ts`
```
Hapus: finalize mutation
```

File: `src/modules/cash-bank/pages/BankReconciliationFormPage.tsx`
```
Hapus: tombol Finalize dan handler-nya
```

### Step 7: Report fixes (15 menit)

File: `src/modules/reports/services/reportsApi.ts`
```
arAging: GET /sales/ar/aging (bukan /reports/ar-aging)
apAging: GET /purchase/ap/aging (bukan /reports/ap-aging)
Hapus atau disable: exportPdf, exportExcel
```

File: `src/modules/reports/pages/ReconciliationPage.tsx`
```
Tambah 3 tab: grni, customer-deposits, vendor-deposits
```

File: `src/modules/accounting/services/journalEntryApi.ts`
```
Tambah: approve: (id) => http.post(`/journals/${id}/approve`)
```

File: `src/modules/accounting/pages/JournalFormPage.tsx`
```
Tambah tombol Approve dengan PermissionGuard 'journal.approve'
```

File: `src/modules/reports/routes.tsx`
```
Hapus atau comment route /reports/transactions (backend belum ada)
```

---

## Build & Commit

```bash
npm run build   # harus 0 error
git commit -m "fix(contracts): phase 8 — permission keys, ribbon paths, HTTP methods"
git push
```
