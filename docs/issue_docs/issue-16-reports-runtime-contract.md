# Issue-16 — Reports Runtime Contract and Endpoint Guards

**Tipe**: Report DTO adapter + runtime guard  
**Severity**: Critical  
**Sumber**: Audit-12 A12-12, A12-15  
**Status**: ✅ Done (Phase 18, 2026-06-16)

---

## Resolusi (Phase 18)

- `reports.types.ts` ditulis ulang mengikuti shape backend aktual (verifikasi read-only `App\Services\Reports\*`):
  - Trial Balance → `{ accounts[], totals }` (sebelumnya salah baca `lines` + `closing_*`).
  - Profit Loss & Balance Sheet → generic `{ sections[], totals }` (sebelumnya asumsi `revenue/cogs/gross_profit/...` yang tidak diproduksi backend).
  - Cash Flow → `{ summary, accounts[], no_cash_accounts }` (sebelumnya `operating/investing/financing` yang tidak ada).
  - Financial Summary → `{ profit_loss, balance_sheet, cash_flow }` nested (sebelumnya field flat).
- `reportsApi.ts` jadi adapter boundary: setiap response dinormalkan (`num/str/asArray`) → array selalu ada, page tidak pernah baca `undefined`.
- Page TB/PL/BS/CF/FinSummary dirender ulang sesuai shape + guard + empty state.
- Endpoint fiktif dihapus: `reportExportApi` (export PDF/Excel) + `useReportExport.ts` + tombol export di semua page; `transactionList` + `TransactionListPage.tsx` + route `/reports/transactions` + kartu index.
- Build pass 0 error.

---

## Ringkasan

Halaman laporan melempar error `Cannot read properties of undefined` karena frontend membaca shape lama, sementara backend mengirim shape report aktual. Selain itu transaction report dan export PDF/Excel masih memakai endpoint yang tidak tersedia.

---

## Root Cause

| Report | Frontend saat audit | Backend aktual |
|---|---|---|
| Trial Balance | `report.lines` | `accounts`, `totals` |
| Profit Loss | `report.revenue`, `cost_of_goods_sold`, `operating_expenses`, `net_income` | `sections`, `totals` |
| Balance Sheet | `report.assets.current_assets`, `report.liabilities`, `report.equity` | `sections`, `totals` |
| Cash Flow | `operating`, `investing`, `financing`, `net_change` | array/section shape service aktual |
| Transaction List | `/reports/transactions` | tidak ada route |
| Export | `/reports/{type}/export/pdf|excel` | tidak ada route |

---

## File Terkena

```text
src/modules/reports/pages/*
src/modules/reports/services/reportsApi.ts
src/modules/reports/types/reports.types.ts
src/modules/reports/components/ReportCompactBar.tsx
src/modules/reports/hooks/useReportExport.ts
```

Backend read-only reference:

```text
/workspace/laravel_backend/app/Modules/Reports
/workspace/laravel_backend/routes or module route files for reports
```

---

## Prinsip Fix

- Service reports harus menjadi adapter boundary.
- Page tidak boleh langsung asumsi property nested tanpa guard.
- Empty state digunakan saat data tidak tersedia, bukan crash.
- Tombol export disembunyikan/disabled jika endpoint belum ada.
- Transaction report disembunyikan dari UI sampai route backend tersedia atau diberi fallback eksplisit.

---

## Acceptance Criteria

- Trial Balance, Profit Loss, Balance Sheet, Cash Flow tidak crash walau data kosong/shape berubah.
- Types report mengikuti adapter frontend yang stabil.
- Export buttons tidak memanggil endpoint fiktif.
- Transaction report tidak mengarah ke 404.
- Build pass.
