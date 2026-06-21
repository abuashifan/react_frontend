# Audit-12 — Frontend UX, Workflow, Filter, Tabs, Reports Audit

Tanggal: 16-06-26  
Scope: Frontend ERP `/workspace/frontend` vs temuan user + verifikasi source code frontend/backend Laravel `/workspace/laravel_backend`  
Status: Context audit terbaru setelah Audit-11 dan Phase 10/13/17. Gunakan file ini sebagai entry point terbaru untuk perbaikan UX/workflow frontend.

---

## 1. Tujuan File Ini

Audit-12 mencatat temuan user terbaru, memverifikasi ke source code aktual, dan menambahkan temuan baru yang terlihat saat audit statis.

Audit ini berfokus pada:

- filter list dan date range;
- checkbox row selection + bulk action;
- virtual tabs dan draft form state;
- ribbon Aktiva Tetap;
- searchable select di form;
- mode edit/detail;
- normalisasi tanggal input;
- laporan yang crash;
- mismatch baru yang belum tercatat di Audit-11.

---

## 2. Ringkasan Eksekutif

| Area | Status |
|---|---|
| Build terakhir sebelum audit | `npm run build` pass pada Phase 13 + 10 |
| Full lint | Masih gagal karena debt lama: route Fast Refresh, `setState` di effect, unused vars, RHF `watch()` warning |
| User findings | Semua dimasukkan ke A12 issue register |
| Temuan baru audit | Ditambahkan: route detail saldo stok mismatch, filter param inventory tidak didukung backend, report export/transaction endpoints masih tidak ada, lint debt sebagai blocker kualitas |

Prioritas tertinggi:

1. A12-12 Reports crash.
2. A12-01/A12-02 Filter multi-select + date range.
3. A12-06/A12-07 Table checkbox + bulk void.
4. A12-08 Draft form persistence.
5. A12-05/A12-13 Inventory stock balance display/detail mismatch.

---

## 3. User Findings Intake

| No | Temuan user | Masuk issue |
|---|---|---|
| 1 | Filter harus bisa multi-select dengan checkbox lebih dari 1 | A12-01 |
| 2 | Tidak ada filter tanggal pada cash bank, sales/purchase transaction list, inventory movement/adjustment/opname | A12-02 |
| 3 | Tombol close all primary virtual tabs | A12-03 |
| 4 | Ribbon menu Aktiva Tetap masih kosong | A12-04 |
| 5 | Inventory > stock saldo list nomor barang dan deskripsi belum muncul | A12-05 |
| 6 | Checkbox pada DataTable list belum ada | A12-06 |
| 7 | Tombol bulk void belum ada | A12-07 |
| 8 | Data form belum disimpan hilang saat pindah tab/refresh | A12-08 |
| 9 | Pemilihan akun/customer/product belum bisa search data | A12-09 |
| 10 | Data dari list seharusnya langsung ke edit mode | A12-10 |
| 11 | Tanggal form saat edit masih format display, bukan nilai input backend | A12-11 |
| 12 | Semua laporan error `Cannot read properties of undefined` | A12-12 |

---

## 4. Verified Issue Register

### A12-01 — Filter Checkbox Masih Single-Select

Severity: High  
Status: Verified  
Sumber: temuan user + source frontend.

Root cause:

- Banyak list memakai checkbox, tetapi state hanya satu value: `filterStatus`, `filterType`, `stockStatus`.
- Pattern terlihat di:
  - `src/modules/cash-bank/pages/CashReceiptListPage.tsx`
  - `src/modules/cash-bank/pages/CashPaymentListPage.tsx`
  - `src/modules/cash-bank/pages/BankTransferListPage.tsx`
  - `src/modules/sales/pages/*ListPage.tsx`
  - `src/modules/purchase/pages/*ListPage.tsx`
  - `src/modules/inventory/pages/StockMovementListPage.tsx`
  - `src/modules/inventory/pages/StockAdjustmentListPage.tsx`
  - `src/modules/inventory/pages/StockOpnameListPage.tsx`

Contoh current behavior:

- `checked={filterStatus === s}`
- `onCheckedChange={(c) => setFilterStatus(c ? s : undefined)}`

Dampak:

- User hanya bisa memilih 1 status/type walaupun UI memakai checkbox.
- UX checkbox misleading; secara visual mengesankan multi-select.

Rekomendasi:

- Ubah state filter menjadi array: `status: Status[]`, `type: Type[]`.
- Tambah serializer query param sesuai backend decision:
  - opsi A: `status[]=draft&status[]=posted`;
  - opsi B: `status=draft,posted`;
  - opsi C: frontend client-side filter sementara jika backend belum support.
- Buat helper reusable `MultiCheckboxFilter`.

---

### A12-02 — Date Range Filter Hilang di Banyak Transaction List

Severity: High  
Status: Verified  
Sumber: temuan user + grep list pages.

List terdampak:

- Cash Bank:
  - `CashReceiptListPage.tsx`
  - `CashPaymentListPage.tsx`
  - `BankTransferListPage.tsx`
- Sales:
  - `QuotationListPage.tsx`
  - `SalesOrderListPage.tsx`
  - `DeliveryOrderListPage.tsx`
  - `ProformaListPage.tsx`
  - `SalesInvoiceListPage.tsx`
  - `SalesReceiptListPage.tsx`
  - `SalesReturnListPage.tsx`
- Purchase:
  - `PurchaseRequestListPage.tsx`
  - `PurchaseOrderListPage.tsx`
  - `GoodsReceiptListPage.tsx`
  - `VendorBillListPage.tsx`
  - `VendorPaymentListPage.tsx`
  - `VendorDepositListPage.tsx`
  - `PurchaseReturnListPage.tsx`
- Inventory:
  - `StockMovementListPage.tsx`
  - `StockAdjustmentListPage.tsx`
  - `StockOpnameListPage.tsx`

Root cause:

- Sidebar filter hanya status/customer/vendor/warehouse/type.
- Tanggal hanya tampil sebagai kolom, bukan filter.

Dampak:

- User tidak bisa membatasi daftar transaksi berdasarkan periode.
- Query list raw bisa berat dan sulit dicari.

Rekomendasi:

- Tambahkan `date_from` + `date_to` di semua list transaksi.
- Cocokkan nama param backend per endpoint sebelum implement:
  - cash bank mungkin `date_from/date_to` atau date-specific.
  - sales/purchase list harus diverifikasi controller request aktual.
  - inventory movement/adjustment/opname perlu cek request filters.
- Buat komponen reusable `DateRangeFilterSection`.

---

### A12-03 — Tidak Ada Tombol Close All Primary Virtual Tabs

Severity: Medium  
Status: Verified  
Sumber: `PrimaryTabs.tsx`, `useTabStore.ts`.

Root cause:

- `PrimaryTabs.tsx` hanya punya close per tab.
- `useTabStore.ts` hanya punya `closePrimaryTab`, belum ada `closeAllPrimaryTabs`.
- Dashboard tab pinned dan tidak bisa ditutup, tetapi tidak ada action untuk menutup semua tab non-dashboard.

Dampak:

- User harus menutup tab satu per satu.
- Workflow multi-module cepat penuh karena `MAX_PRIMARY_TABS = 10`.

Rekomendasi:

- Tambah action store `closeAllPrimaryTabs()` yang menyisakan dashboard.
- Tambah tombol icon close all di sisi kanan primary tabs dengan tooltip.
- Pastikan active tab kembali ke dashboard atau tab yang dipilih sesuai UX decision.

---

### A12-04 — Ribbon Aktiva Tetap Dilaporkan Kosong

Severity: Medium  
Status: Partially Verified / Needs runtime verification  
Sumber: temuan user + `src/router/moduleConfig.ts`.

Status source code saat audit:

- `fixed-assets.ribbonItems` sudah berisi:
  - Daftar Aktiva
  - Kategori
  - Register
  - Depresiasi
  - Disposal
  - Rekonsiliasi

Kemungkinan root cause jika UI user masih kosong:

- Build/dev server lama belum memuat perubahan terbaru.
- Permission payload user tidak memiliki:
  - `fixed_assets.view`
  - `fixed_assets.settings.view`
  - `fixed_assets.reports.view`
- `RibbonPanel` menyaring item dengan `PermissionGuard` logic:
  - jika `permissionsLoaded === true` dan user tidak punya permission, semua item hilang.

Dampak:

- Module top-level terlihat ada, tetapi ribbon tanpa menu.

Rekomendasi:

- Verifikasi permission dari `/auth/me` atau auth store pada user aktual.
- Tambahkan fallback diagnostic untuk ribbon kosong: tampilkan empty state kecil “Tidak ada menu yang tersedia untuk permission Anda”.
- Pastikan role seed/backend memberi fixed-assets permission ke role yang diuji.

---

### A12-05 — Inventory Stock Balance: Kode/Nama/Deskripsi Produk Tidak Muncul

Severity: High  
Status: Verified  
Sumber: temuan user + frontend/backend DTO mismatch.

Root cause:

- Frontend `StockBalanceListPage.tsx` membaca:
  - `original.product?.name`
  - `original.product?.code`
- Backend relation Product memakai field master-data canonical:
  - `product_name`
  - `product_code`
  - kemungkinan `description`
- Backend `StockBalanceService::list()` hanya `with(['product', 'warehouse'])`, tanpa adapter flatten.

Dampak:

- Nama/kode produk tampil `-`.
- Detail saldo stok breadcrumb/detail juga kosong karena membaca field lama.

Rekomendasi:

- Update `StockBalance` type relation product ke `product_code/product_name/description`.
- Tambahkan adapter service frontend:
  - `product.name = product.product_name`
  - `product.code = product.product_code`
  - `product.description = product.description`
- Tambah kolom Deskripsi bila memang dibutuhkan user.

---

### A12-06 — Checkbox Row Selection Tidak Muncul di List

Severity: High  
Status: Verified  
Sumber: temuan user + `DataTable.tsx`.

Root cause:

- `DataTable` hanya inject checkbox column jika:
  - `onRowSelect` ada; dan
  - `bulkActions.length > 0`.
- Grep di list modules cash-bank/sales/purchase/inventory tidak menemukan penggunaan:
  - `selectedRows`
  - `onRowSelect`
  - `bulkActions`

Dampak:

- Tidak ada checkbox row di list transaksi.
- Bulk action bar tidak pernah muncul.

Rekomendasi:

- Tentukan policy global: semua document list selectable atau hanya list dengan bulk action.
- Tambahkan state selection di page atau wrapper list reusable.
- Pisahkan prop `selectable` dari `bulkActions` jika checkbox harus bisa muncul sebelum bulk action tersedia.

---

### A12-07 — Bulk Void Belum Ada

Severity: High  
Status: Verified  
Sumber: temuan user + frontend/backend routes.

Root cause:

- Frontend hanya punya void per dokumen di form/detail.
- Tidak ada list page yang mengirim `bulkActions`.
- Backend route list hanya menyediakan per-id void:
  - `/cash-bank/cash-receipts/{id}/void`
  - `/cash-bank/cash-payments/{id}/void`
  - `/cash-bank/bank-transfers/{id}/void`
  - `/sales/.../{id}/void`
  - `/purchase/.../{id}/void`
  - `/inventory/.../{id}/void`
- Tidak ditemukan endpoint bulk/batch void.

Dampak:

- User harus buka dokumen satu per satu untuk void.

Rekomendasi:

- Opsi cepat frontend: bulk void loop per selected id dengan progress dan partial failure summary.
- Opsi canonical backend: tambah endpoint bulk void per module/document type.
- Tetap gunakan `VoidConfirmDialog`, tetapi support jumlah dokumen + reason satu kali.

---

### A12-08 — Draft Form State Belum Persist Saat Pindah Tab/Refresh

Severity: Critical  
Status: Verified  
Sumber: temuan user + `useTabStore.ts` + grep usage.

Root cause:

- `useTabStore` sudah punya field dan action:
  - `SecondaryTab.formState`
  - `updateFormState`
  - `clearFormState`
- Tidak ada form page yang memanggil `updateFormState`.
- Store tab persist ke `sessionStorage`, bukan draft storage khusus.
- React Hook Form state berada lokal di component; saat route/tab berpindah, component unmount dan input hilang.

Dampak:

- Data belum disimpan hilang saat pindah tab/form.
- Refresh bisa tidak konsisten; tab state mungkin bertahan, tetapi isi form tidak disimpan.

Rekomendasi:

- Buat `usePersistentFormDraft` berbasis RHF `watch` + debounce.
- Storage key: module + route + document id/new + company id.
- Simpan ke `localStorage` atau IndexedDB untuk bertahan saat browser refresh.
- Clear draft saat save berhasil, void/cancel, atau user discard.
- Untuk line item state di luar RHF, draft hook harus support custom serializer.

---

### A12-09 — Searchable Select Akun/Customer/Product Bermasalah

Severity: High  
Status: Partially Verified  
Sumber: temuan user + `SearchableSelect.tsx` + form usage.

Yang sudah ada:

- `SearchableSelect` mendukung async search.
- Banyak form sudah memakai:
  - `coaApi.search`
  - `kontakApi.search`
  - `produkApi.search`

Masalah yang terverifikasi:

- Search baru berjalan setelah minimal 2 karakter (`MIN_CHARS = 2`), tanpa default options saat dropdown dibuka.
- Beberapa line item tidak memberi `selectedOptions`, sehingga saat edit label bisa hilang atau tampil `ID x`.
- `VendorBillFormPage.tsx` eksplisit memberi `selectedOptions={[]}` untuk kategori aset line.
- Journal line/account dan beberapa cash-bank line/account tidak preload label relation ke `selectedOptions`.
- Jika backend search param tidak cocok atau relation label memakai field DTO berbeda, user melihat “tidak ditemukan”.

Dampak:

- User mengira field tidak bisa search.
- Saat edit, customer/product/account bisa kosong walaupun id tersimpan.

Rekomendasi:

- Tambahkan initial search on open dengan query kosong untuk top 10 aktif.
- Turunkan/konfigurasi `MIN_CHARS` jika UX butuh pencarian langsung.
- Audit semua `SearchableSelect` line item agar memberi `selectedOptions` dari relation backend.
- Pastikan search service mapping label mengikuti DTO backend canonical.

---

### A12-10 — Buka Data dari List Belum Punya Edit Mode yang Konsisten

Severity: Medium  
Status: Verified / UX decision needed  
Sumber: temuan user + form pages.

Root cause:

- Banyak form memakai konsep `isEditable = isCreate || status === 'draft'`.
- Dokumen non-draft/posted dibuka sebagai read-only karena workflow guard.
- Tidak ada mode eksplisit `view` vs `edit` dengan tombol “Edit”.
- User expectation: klik dari list langsung masuk edit mode untuk data yang bisa diedit.

Dampak:

- User merasa data yang sudah dibuat tidak bisa diedit.
- Behavior antar module tidak konsisten.

Rekomendasi:

- Definisikan UX global:
  - draft/editable status langsung edit mode;
  - non-editable status read-only dengan banner alasan;
  - optional tombol “Edit” jika backend mengizinkan.
- Tambah visual state “Mode Edit”/“Read-only” di bottom action bar.
- Audit permission/status per document type.

---

### A12-11 — Date Input Tidak Dinormalisasi Saat Data Edit Dibuka

Severity: High  
Status: Verified  
Sumber: temuan user + grep form reset.

Root cause:

- Banyak form melakukan `reset({ date: backend.date })` langsung.
- HTML `<input type="date">` butuh format `YYYY-MM-DD`.
- Jika backend mengirim datetime, localized date, atau ISO dengan timezone, input date bisa kosong/format aneh.

Contoh area:

- `JournalFormPage.tsx`: `journal.journal_date`
- `CashReceiptFormPage.tsx`: `receipt.receipt_date`
- `CashPaymentFormPage.tsx`: `payment.payment_date`
- `BankTransferFormPage.tsx`: `transfer.transfer_date`
- Sales/Purchase form pages: `date`, `due_date`, `expiry_date`, `expected_delivery_date`
- Inventory form pages: `movement_date`, `adjustment_date`, `opname_date`

Dampak:

- Tanggal tidak tampil benar saat edit.
- Save ulang bisa mengirim date kosong atau format salah.

Rekomendasi:

- Buat helper shared `toDateInputValue(value): string`.
- Terapkan di semua `reset()` dan default values dari backend.
- Jangan pakai `formatDate()` untuk value input; `formatDate()` hanya display.

---

### A12-12 — Laporan Crash `Cannot read properties of undefined`

Severity: Critical  
Status: Verified  
Sumber: temuan user + frontend report pages + backend services.

Root cause utama:

- Frontend report types/pages masih mengasumsikan shape lama.
- Backend actual shape berbeda.

Mismatch terverifikasi:

| Report | Frontend membaca | Backend actual |
|---|---|---|
| Trial Balance | `report.lines` | `accounts`, `totals` |
| Profit Loss | `report.revenue`, `cost_of_goods_sold`, `operating_expenses`, `net_income` | `sections`, `totals` |
| Balance Sheet | `report.assets.current_assets`, `report.liabilities`, `report.equity` | `sections`, `totals` |
| Cash Flow | `report.operating`, `investing`, `financing`, `net_change` | service returns custom array shape, perlu adapter |
| Transaction List | `/reports/transactions` | backend route tidak ada |
| Export PDF/Excel | `/reports/{type}/export/pdf|excel` | backend route tidak ada |

Dampak:

- Halaman laporan melempar unexpected application error.
- Export report 404.

Rekomendasi:

- Buat adapter per report service di frontend.
- Tambahkan runtime guards sebelum render: `Array.isArray(report.accounts)`, fallback empty state.
- Hapus/hide export buttons sampai endpoint tersedia.
- Hapus/hide transaction report atau implement backend route.
- Tambah support reconciliation backend yang belum diexpose: GRNI, customer deposits, vendor deposits.

---

### A12-13 — Stock Balance Detail Route/API Mismatch

Severity: High  
Status: New finding / Verified  
Sumber: audit source.

Root cause:

- Frontend route:
  - `/inventory/stock-balances/:productId/:warehouseId`
- Frontend service:
  - `GET /inventory/stock-balances/{productId}/{warehouseId}`
- Backend routes:
  - `GET /inventory/stock-balances/product/{productId}`
  - `GET /inventory/stock-balances/warehouse/{warehouseId}`
  - Tidak ada route kombinasi `{productId}/{warehouseId}`.

Dampak:

- Klik detail saldo stok dari list akan 404.

Rekomendasi:

- Opsi backend: tambah route detail kombinasi product+warehouse.
- Opsi frontend: pakai list endpoint dengan `product_id` + `warehouse_id`, lalu ambil row pertama.
- Samakan breadcrumb/detail product field dengan DTO product canonical.

---

### A12-14 — Beberapa Filter Inventory Tidak Didukung Backend

Severity: Medium  
Status: New finding / Verified  
Sumber: `StockBalanceListPage.tsx`, `stockBalance.types.ts`, backend `StockBalanceService::list`.

Root cause:

- Frontend type/list mengirim:
  - `search`
  - `product_category_id`
  - `stock_status`
- Backend `StockBalanceService::list()` hanya membaca:
  - `product_id`
  - `warehouse_id`
  - `has_stock`

Dampak:

- Filter status stok normal/low/negative tidak bekerja di backend.
- User bisa memilih filter yang tidak mengubah hasil.

Rekomendasi:

- Tambah backend support atau hapus/hide filter sampai tersedia.
- Jika low/negative dihitung client-side, harus jelas hanya pada current page data.

---

### A12-15 — Report Export dan Transaction Report Masih Endpoint Fiktif

Severity: Medium  
Status: New finding / Verified  
Sumber: backend report routes + `reportsApi.ts`.

Root cause:

- `reportsApi.transactionList` memanggil `/reports/transactions`, backend tidak punya route.
- `reportExportApi` memanggil `/reports/{type}/export/pdf|excel`, backend tidak punya route.

Dampak:

- Export buttons gagal.
- Transaction list report gagal.

Rekomendasi:

- Hide export buttons sampai backend endpoint tersedia.
- Atau implement backend export route.
- Hapus report transaction dari ribbon/list jika belum didukung backend.

---

### A12-16 — Full Lint Masih Gagal

Severity: Medium  
Status: New finding / Verified dari run terakhir sebelum audit selesai  
Sumber: `npm run lint`.

Kategori error:

- `react-refresh/only-export-components` di banyak `routes.tsx`.
- `react-hooks/set-state-in-effect` di beberapa settings/master pages.
- `@typescript-eslint/no-unused-vars` di `SalesOrderFormPage.tsx`.
- Banyak warning `react-hooks/incompatible-library` karena RHF `watch()` dipakai langsung dalam render.

Dampak:

- Kualitas CI/lint tidak bisa dipakai sebagai gate sampai debt dibereskan.
- Warning RHF watch bisa jadi gejala rerender/performance dan perlu pola `useWatch`.

Rekomendasi:

- Buat phase lint cleanup terpisah.
- Tambah file-level disable untuk route config jika pattern memang disetujui.
- Ganti direct `watch()` render usage dengan `useWatch`.

---

## 5. Prioritas Implementasi Audit-12

| Urutan | Issue | Nama | Severity | Catatan |
|---|---|---|---|---|
| 1 | A12-12 | Reports crash | Critical | User-facing fatal error |
| 2 | A12-05 + A12-13 | Stock balance display/detail mismatch | High | Nomor/nama barang kosong + detail 404 |
| 3 | A12-01 + A12-02 | Multi-select filter + date range | High | Banyak list terdampak |
| 4 | A12-06 + A12-07 | Row checkbox + bulk void | High | Perlu policy dan endpoint/loop |
| 5 | A12-08 | Persistent unsaved form draft | Critical | Perlu reusable hook |
| 6 | A12-09 | SearchableSelect UX/preload labels | High | Perbaiki akun/customer/product |
| 7 | A12-11 | Date input normalization | High | Shared helper |
| 8 | A12-03 | Close all primary tabs | Medium | Store + UI |
| 9 | A12-04 | Fixed assets ribbon runtime check | Medium | Permission/cache |
| 10 | A12-10 | Edit/view mode decision | Medium | Butuh UX policy |
| 11 | A12-14 + A12-15 | Unsupported inventory/report endpoints | Medium | Backend/frontend decision |
| 12 | A12-16 | Lint cleanup | Medium | CI quality gate |

---

## 6. Catatan Implementasi untuk Agent Berikutnya

- Jangan mulai dari Audit-11 lagi sebagai context final; Audit-12 ini adalah context terbaru.
- Tetap baca `AGENTS.md`, `docs/AGENT_ENTRY_POINT.md`, lalu Audit-12.
- Perbaikan sebaiknya dipisah phase kecil:
  - reports adapter;
  - stock balance DTO/route;
  - filter system;
  - DataTable selection/bulk;
  - draft persistence;
  - SearchableSelect preload/search UX;
  - date normalization.
- Untuk setiap perubahan:
  - update `docs/struktur_frontend.md` jika tambah file;
  - jalankan `npm run build`;
  - lint full masih punya debt, jadi minimal lint targeted sampai A12-16 dibereskan.
