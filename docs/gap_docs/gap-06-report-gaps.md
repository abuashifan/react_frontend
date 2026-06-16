# GAP-06 — Report Endpoint Gaps

**Severity**: 🟡 Medium  
**Tipe**: Campuran — backend ada tapi frontend tidak ada, dan frontend ada tapi backend tidak ada

---

## Backend Ada, Frontend Tidak Implementasikan

### 1. Reconciliation tabs yang hilang

`ReconciliationPage.tsx` saat ini hanya punya tab: `ar`, `ap`, `inventory`.

Backend punya tambahan:
```
GET /reports/reconciliation/grni                — Goods Receipt Not Invoiced
GET /reports/reconciliation/customer-deposits   — Customer deposit reconciliation
GET /reports/reconciliation/vendor-deposits     — Vendor deposit reconciliation
```

**Fix**: Tambah 3 tab di `ReconciliationPage.tsx` dengan query ke endpoint tersebut.

### 2. Account Ledger Detail

```
GET /reports/account-ledger/{account}  permission: reports.view
```

Frontend punya `GeneralLedgerPage.tsx` yang menampilkan semua akun, tapi tidak ada drill-down ke detail satu akun.

**Fix**: Tambah klik pada baris akun di GeneralLedger → buka halaman/sheet detail akun.  
Atau buat `AccountLedgerDetailPage.tsx` di `/reports/account-ledger/:accountId`.

### 3. Journal Approve

```
POST /journals/{id}/approve  permission: journal.approve
```

`JournalFormPage.tsx` punya tombol Post dan Void tapi tidak punya tombol Approve.

**Fix**: Tambah tombol Approve di JournalFormPage dengan PermissionGuard `journal.approve`.

---

## Frontend Ada, Backend Tidak Punya

### 1. Export PDF & Excel

Frontend `reportsApi.ts` punya:
```ts
exportPdf: (reportType, params) → GET /reports/{reportType}/export/pdf
exportExcel: (reportType, params) → GET /reports/{reportType}/export/excel
```

**Backend tidak punya endpoint ini sama sekali.**

**Solusi jangka pendek**: Sembunyikan tombol export (kondisional berdasarkan feature flag atau hapus dari UI).  
**Solusi jangka panjang**: Backend tambah export endpoint, atau gunakan client-side PDF (print to PDF via CSS).

### 2. Transaction List Report

`TransactionListPage.tsx` di frontend memanggil:
```ts
GET /reports/transactions?type=sales|purchase
```

**Tidak ada di backend.**

**Solusi**: Gunakan existing list endpoints (`/sales/invoices`, `/purchase/bills`, dll) dengan filter, atau hapus halaman ini sampai backend siap.

### 3. AR Aging dan AP Aging

`ArAgingReportPage.tsx` mungkin memanggil `/reports/ar-aging`.  
**Backend yang benar**: `/sales/ar/aging` (di module Sales, bukan Reports).

`ApAgingReportPage.tsx` mungkin memanggil `/reports/ap-aging`.  
**Backend yang benar**: `/purchase/ap/aging` (di module Purchase, bukan Reports).

Perlu cek endpoint yang dipakai di `reportsApi.ts`.

---

## Inventory Reports (Endpoint ada di backend, perlu cek frontend)

Backend punya:
```
GET /inventory/reports/stock-balances    permission: inventory.reports.view
GET /inventory/reports/stock-movements   permission: inventory.reports.view
GET /inventory/reports/stock-card        permission: inventory.reports.view
GET /inventory/reports/valuation         permission: inventory.reports.view
GET /inventory/reports/low-stock         permission: inventory.reports.view
GET /inventory/reports/negative-stock    permission: inventory.reports.view
```

Frontend punya `StockReportPage.tsx` dan `InventoryAnalysisPage.tsx`. Perlu verifikasi apakah endpoint yang dipakai sudah cocok.

---

## Cash Bank: Account Statement

```
GET /cash-bank/reports/account-statement  permission: cash_bank.view
```

**Frontend tidak punya halaman ini sama sekali.**  
Bisa ditambahkan sebagai ribbon item di Cash & Bank module: "Laporan Rekening".

---

## Checklist Fix Prioritas

| Item | Effort | Prioritas |
|------|--------|-----------|
| Tambah tab GRNI, customer-deposits, vendor-deposits di ReconciliationPage | Kecil | High |
| Cek AR/AP aging endpoint di reportsApi.ts | Minimal | High |
| Tambah tombol Approve di JournalFormPage | Kecil | Medium |
| Sembunyikan tombol export (backend belum ada) | Kecil | Medium |
| Verifikasi inventory report endpoints | Minimal | Medium |
| Buat Account Ledger Detail Page | Sedang | Low |
| Buat Cash Bank Account Statement Page | Sedang | Low |
| Hapus/disable TransactionListPage | Kecil | Low |
