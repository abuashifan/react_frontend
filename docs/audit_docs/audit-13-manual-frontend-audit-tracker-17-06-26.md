# Audit 13 - Manual Frontend Audit Tracker# Audit 13 - Manual Frontend Audit Tracker# Audit 13 - Manual Frontend Audit Tracker

Tanggal dibuat: 2026-06-17
Status dokumen: Template tracking audit manual
Scope: Frontend ERP `/workspace/frontend`
Tujuan: Membantu audit manual dari list page, form input, report, workflow, permission, responsive behavior, sampai modul/fitur yang belum ada.

---

## Cara Pakai Cepat

1. Buat satu baris di `Audit Run Log` setiap mulai sesi audit.
2. Pilih modul dan halaman dari `Baseline Modul & Halaman`.
3. Untuk setiap halaman, isi checklist sesuai tipe halaman:
   - List/table: gunakan `Checklist List Page`.
   - Form/input: gunakan `Checklist Form Input`.
   - Laporan: gunakan `Checklist Laporan`.
   - Modul belum ada atau tidak lengkap: catat di `Missing Module / Missing Feature Log`.
4. Setiap bug, gap, mismatch, atau UX issue masuk ke `Finding Log`.
5. Setelah selesai sesi, update `Laporan Ringkas Hasil Audit`.

Status yang dipakai:

| Status | Arti |
|---|---|
| `not-started` | Belum diaudit |
| `in-progress` | Sedang diaudit |
| `passed` | Lulus audit manual |
| `issue-found` | Ada temuan yang perlu diperbaiki |
| `blocked` | Tidak bisa diuji karena data, permission, endpoint, atau build/runtime error |
| `not-applicable` | Tidak relevan untuk halaman tersebut |

Severity temuan:

| Severity | Kriteria |
|---|---|
| `critical` | Workflow utama tidak bisa dipakai, data salah, submit rusak, laporan menyesatkan, atau risiko kehilangan data |
| `high` | Fitur penting ada tapi salah, tidak konsisten dengan backend, validasi penting hilang, permission/action berbahaya |
| `medium` | UX mengganggu, filter/search/pagination bermasalah, responsive patah, state kurang stabil |
| `low` | Copywriting, alignment kecil, empty/loading state kurang rapi, polish |

---

## Setup Audit

Isi ini sebelum mulai audit agar hasilnya bisa direproduksi.

| Field | Isi |
|---|---|
| Auditor |  |
| Tanggal audit |  |
| Branch / commit |  |
| Browser & versi |  |
| Viewport desktop |  |
| Viewport tablet |  |
| Viewport pendek |  |
| User role |  |
| Company / tenant |  |
| Data seed / data contoh |  |
| API backend target |  |
| Catatan environment |  |

Minimum viewport yang disarankan:

| Tipe | Ukuran |
|---|---|
| Desktop normal | `1440 x 900` |
| Laptop pendek | `1366 x 620` |
| Tablet landscape | `1180 x 820` |
| Tablet portrait | `820 x 1180` |
| Mobile sanity check | `390 x 844` |

---

## Audit Run Log

| Run ID | Tanggal | Auditor | Modul | Area | Status | Ringkasan |
|---|---|---|---|---|---|---|
| A13-R001 |  |  |  |  | not-started |  |

---

## Baseline Modul & Halaman

Gunakan tabel ini sebagai daftar utama halaman yang perlu dicek manual. Kolom `Status Audit` diupdate selama audit.

### Dashboard

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Dashboard utama | `/` | Dashboard | KPI, chart, aktivitas terbaru, fallback jika API belum tersedia | not-started |  |

### Master Data

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Akun / COA list | `/master-data/coa` | List | Kolom, search, pagination, create/edit/delete, status akun | not-started |  |
| Akun / COA form | `/master-data/coa/create`, `/master-data/coa/:id` | Form | Validasi kode/nama/tipe akun, parent account, submit/update | not-started |  |
| Kontak list | `/master-data/contacts` | List | Customer/vendor filter, status, action, data kontak | not-started |  |
| Kontak form | `/master-data/contacts/create`, `/master-data/contacts/:id` | Form | Tipe kontak, alamat, pajak, payment term, validasi wajib | not-started |  |
| Produk list | `/master-data/products` | List | Tipe produk, satuan, kategori, harga, stok, filter | not-started |  |
| Produk form | `/master-data/products/create`, `/master-data/products/:id` | Form | SKU, satuan, kategori, akun mapping, inventory flag | not-started |  |
| Kategori produk | `/master-data/product-categories` | Simple CRUD | Create/edit/delete, duplicate handling | not-started |  |
| Satuan | `/master-data/units` | Simple CRUD | Create/edit/delete, kode unik | not-started |  |
| Gudang | `/master-data/warehouses` | Simple CRUD | Create/edit/delete, default warehouse, status | not-started |  |
| Syarat bayar | `/master-data/payment-terms` | Simple CRUD | Termin hari, default, validasi angka | not-started |  |
| Departemen | `/master-data/departments` | Simple CRUD | Create/edit/delete, status | not-started |  |
| Proyek | `/master-data/projects` | Simple CRUD | Create/edit/delete, status | not-started |  |
| Pemetaan akun | `/master-data/account-mappings` | Settings/Form | Mapping wajib, error mapping kosong, save behavior | not-started |  |

### Accounting & Opening Balance

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Jurnal umum list | `/accounting/journals` | List | Debit/kredit, status, source document, filter tanggal | not-started |  |
| Jurnal umum form | `/accounting/journals/create`, `/accounting/journals/:id` | Form | Balanced journal, line item akun, post/void/read-only | not-started |  |
| Saldo awal status | `/opening-balance` | Workflow | Status setup, batch, lock/finalize behavior | not-started |  |
| Saldo awal batch | `/opening-balance/:batchId` | Form/Workflow | Input saldo, balance, submit, error per baris | not-started |  |
| Periode akuntansi | `/accounting/period-locks` | Settings | Lock/unlock period, date read-only impact | not-started |  |
| Akhir periode | `/accounting/period-end` | Workflow | Checklist, run, reopen, blocked state | not-started |  |
| Tahun fiskal | `/accounting/fiscal-years` | Settings | Create/update fiscal year, active year, method contract | not-started |  |

### Cash & Bank

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Penerimaan kas list | `/cash-bank/cash-receipts` | List | Filter, amount, source, status, action | not-started |  |
| Penerimaan kas form | `/cash-bank/cash-receipts/create`, `/cash-bank/cash-receipts/:id` | Form | Akun kas, kontak, alokasi, post/void | not-started |  |
| Pengeluaran kas list | `/cash-bank/cash-payments` | List | Filter, amount, source, status, action | not-started |  |
| Pengeluaran kas form | `/cash-bank/cash-payments/create`, `/cash-bank/cash-payments/:id` | Form | Akun kas, kontak, kategori/akun, post/void | not-started |  |
| Transfer bank list | `/cash-bank/bank-transfers` | List | From/to account, amount, status, action | not-started |  |
| Transfer bank form | `/cash-bank/bank-transfers/create`, `/cash-bank/bank-transfers/:id` | Form | Akun asal/tujuan beda, amount, post/void | not-started |  |
| Rekonsiliasi bank list | `/cash-bank/bank-reconciliations` | List | Periode, akun bank, status, method POST | not-started |  |
| Rekonsiliasi bank form | `/cash-bank/bank-reconciliations/create`, `/cash-bank/bank-reconciliations/:id` | Workflow | Match/unmatch, balance, save, finalize availability | not-started |  |

### Sales

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Quotation list | `/sales/quotations` | List | Search, filter status, bulk action, row action | not-started |  |
| Quotation form | `/sales/quotations/create`, `/sales/quotations/:id` | Form | Customer, item, tax/discount, draft, post/void, convert | not-started |  |
| Sales Order list | `/sales/orders` | List | Status fulfillment, source quotation, filter | not-started |  |
| Sales Order form | `/sales/orders/create`, `/sales/orders/:id` | Form | Source quotation, item, status, delivery/invoice links | not-started |  |
| Delivery Order list | `/sales/delivery-orders` | List | Delivery status, source SO, warehouse | not-started |  |
| Delivery Order form | `/sales/delivery-orders/create`, `/sales/delivery-orders/:id` | Form | Source SO, stock effect, warehouse, post/void | not-started |  |
| Proforma list | `/sales/proformas` | List | Status, source, amount, action | not-started |  |
| Proforma form | `/sales/proformas/create`, `/sales/proformas/:id` | Form | Customer, items, tax, post/void, convert invoice | not-started |  |
| Sales Invoice list | `/sales/invoices` | List | AR status, due date, paid amount, filter | not-started |  |
| Sales Invoice form | `/sales/invoices/create`, `/sales/invoices/:id` | Form | Source SO/DO/proforma, due date, tax, post/void, receipt link | not-started |  |
| Customer Deposit list | `/sales/customer-deposits` | List | Deposit balance, status, customer | not-started |  |
| Customer Deposit form | `/sales/customer-deposits/create`, `/sales/customer-deposits/:id` | Form | Customer, bank account, amount, apply behavior | not-started |  |
| Sales Receipt list | `/sales/receipts` | List | Invoice allocation, payment amount, status | not-started |  |
| Sales Receipt form | `/sales/receipts/create`, `/sales/receipts/:id` | Form | Invoice picker, overpayment, deposit, post/void | not-started |  |
| Sales Return list | `/sales/returns` | List | Source invoice/DO, amount, stock effect | not-started |  |
| Sales Return form | `/sales/returns/create`, `/sales/returns/:id` | Form | Source selection, qty return, refund/credit impact | not-started |  |
| AR summary | `/sales/ar/summary` | Report/List | Aging totals, customer balance, link detail | not-started |  |
| AR aging | `/sales/ar/aging` | Report | Bucket, as-of date, totals | not-started |  |
| AR reconciliation | `/sales/ar/reconciliation` | Report | AR vs GL comparison, mismatch display | not-started |  |
| Customer ledger | `/sales/ar/customer-ledger` | Report | Running balance, filter customer/date | not-started |  |
| Invoice ledger | `/sales/ar/invoice-ledger` | Report | Invoice balance, payment/return link | not-started |  |

### Purchase

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Purchase Request list | `/purchase/requests` | List | Status, requester, filter, action | not-started |  |
| Purchase Request form | `/purchase/requests/create`, `/purchase/requests/:id` | Form | Item, qty, approval-like status, convert PO | not-started |  |
| Purchase Order list | `/purchase/orders` | List | Vendor, status receipt/bill, filter | not-started |  |
| Purchase Order form | `/purchase/orders/create`, `/purchase/orders/:id` | Form | Source PR, vendor, items, tax, post/void | not-started |  |
| Goods Receipt list | `/purchase/goods-receipts` | List | Source PO, warehouse, stock status | not-started |  |
| Goods Receipt form | `/purchase/goods-receipts/create`, `/purchase/goods-receipts/:id` | Form | Stock effect, qty receive, post/void | not-started |  |
| Vendor Bill list | `/purchase/bills` | List | AP status, due date, paid amount | not-started |  |
| Vendor Bill form | `/purchase/bills/create`, `/purchase/bills/:id` | Form | Source PO/GR, direct bill, tax, post/void, payment link | not-started |  |
| Vendor Deposit list | `/purchase/vendor-deposits` | List | Deposit balance, status, vendor | not-started |  |
| Vendor Deposit form | `/purchase/vendor-deposits/create`, `/purchase/vendor-deposits/:id` | Form | Vendor, bank account, amount, apply behavior | not-started |  |
| Vendor Payment list | `/purchase/payments` | List | Bill allocation, payment amount, status | not-started |  |
| Vendor Payment form | `/purchase/payments/create`, `/purchase/payments/:id` | Form | Bill picker, overpayment, deposit, post/void | not-started |  |
| Purchase Return list | `/purchase/returns` | List | Source bill/GR, amount, stock effect | not-started |  |
| Purchase Return form | `/purchase/returns/create`, `/purchase/returns/:id` | Form | Source selection, qty return, debit note/refund impact | not-started |  |
| AP summary | `/purchase/ap/summary` | Report/List | Aging totals, vendor balance, link detail | not-started |  |
| AP aging | `/purchase/ap/aging` | Report | Bucket, as-of date, totals | not-started |  |
| AP reconciliation | `/purchase/ap/reconciliation` | Report | AP vs GL comparison, mismatch display | not-started |  |
| Vendor ledger | `/purchase/ap/vendor-ledger` | Report | Running balance, filter vendor/date | not-started |  |
| Bill ledger | `/purchase/ap/bill-ledger` | Report | Bill balance, payment/return link | not-started |  |

### Inventory

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Saldo stok list | `/inventory/stock-balances` | List/Report | Product/warehouse, qty, avg cost, detail link | not-started |  |
| Saldo stok detail | `/inventory/stock-balances/:productId/:warehouseId` | Detail | Mutasi detail, running qty/value | not-started |  |
| Mutasi stok list | `/inventory/movements` | List | Source type, qty in/out, warehouse, filter | not-started |  |
| Mutasi stok form | `/inventory/movements/create`, `/inventory/movements/:id` | Form | Manual movement, source duplicate, post/void | not-started |  |
| Penyesuaian stok list | `/inventory/adjustments` | List | Adjustment type, status, warehouse | not-started |  |
| Penyesuaian stok form | `/inventory/adjustments/create`, `/inventory/adjustments/:id` | Form | Mixed in/out, duplicate source, journal impact | not-started |  |
| Stock opname list | `/inventory/opnames` | List | Opname status, warehouse, variance | not-started |  |
| Stock opname form | `/inventory/opnames/create`, `/inventory/opnames/:id` | Form | Count qty, variance, post/void, stock impact | not-started |  |

### Fixed Assets

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Daftar aktiva | `/fixed-assets` | List | Status, category, acquisition value, depreciation | not-started |  |
| Form aktiva | `/fixed-assets/create`, `/fixed-assets/:id` | Form | Category, acquisition, useful life, depreciation settings | not-started |  |
| Kategori aktiva | `/fixed-assets/categories` | Simple CRUD | Create/edit/delete, method/rate validation | not-started |  |
| Register aktiva | `/fixed-assets/reports/register` | Report | Filter, totals, detail consistency | not-started |  |
| Depresiasi aktiva | `/fixed-assets/reports/depreciation` | Report | Period, depreciation amount, accumulated depreciation | not-started |  |
| Disposal aktiva | `/fixed-assets/reports/disposals` | Report | Disposal status, gain/loss, date range | not-started |  |
| Rekonsiliasi aktiva | `/fixed-assets/reports/reconciliation` | Report | Asset subledger vs GL | not-started |  |

### Reports

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Index laporan | `/reports` | Index | Semua kartu laporan bisa dibuka, grouping jelas | not-started |  |
| Buku besar | `/reports/general-ledger` | Report | Filter akun/tanggal, running balance, empty state | not-started |  |
| Trial balance | `/reports/trial-balance` | Report | Debit/kredit balance, period filter, totals | not-started |  |
| Laba rugi | `/reports/profit-loss` | Report | Revenue/expense grouping, net profit, date range | not-started |  |
| Neraca | `/reports/balance-sheet` | Report | Asset/liability/equity balance, as-of date | not-started |  |
| Arus kas | `/reports/cash-flow` | Report | Operating/investing/financing, date range | not-started |  |
| Ringkasan keuangan | `/reports/financial-summary` | Report | KPI totals, period, fallback | not-started |  |
| AR aging | `/reports/ar-aging` | Report | Bucket, as-of date, customer totals | not-started |  |
| AP aging | `/reports/ap-aging` | Report | Bucket, as-of date, vendor totals | not-started |  |
| Rekonsiliasi | `/reports/reconciliation` | Report | GL vs subledger mismatch detail | not-started |  |
| Laporan stok | `/reports/stock` | Report | Product/warehouse, qty/value, detail | not-started |  |
| Analisis inventori | `/reports/inventory-analysis` | Report | Negative/low stock, valuation, movement | not-started |  |

### Settings

| Area | Route | Tipe | Hal yang dicek | Status Audit | Finding ID |
|---|---|---|---|---|---|
| Perusahaan | `/settings/company` | Settings/Form | Company profile, tax, address, save | not-started |  |
| Transaksi | `/settings/transactions` | Settings/Form | Numbering, defaults, validation | not-started |  |
| Pemetaan akun | `/settings/account-mapping` | Settings/Form | Required mappings, save, missing mapping errors | not-started |  |
| Periode akuntansi | `/settings/accounting-period` | Settings/Form | Current period, lock impact | not-started |  |
| Pengguna | `/settings/users` | List/Admin | User list, status, role assignment, permission | not-started |  |
| Peran | `/settings/roles` | List/Admin | Permission matrix, create/edit/delete roles | not-started |  |
| Undangan | `/settings/invitations` | List/Admin | Invite, resend/cancel, status | not-started |  |
| Audit akses | `/settings/audit` | Report/List | Actor, event, filter date/user | not-started |  |
| Preferensi saya | `/settings/preferences` | Settings/Form | User preferences save/load | not-started |  |

---

## Checklist Global

Pakai checklist ini untuk semua halaman.

| Item | Expected | Status | Catatan |
|---|---|---|---|
| Route bisa dibuka langsung dari URL | Tidak redirect salah, tidak blank | not-started |  |
| Menu/ribbon membuka halaman yang benar | Path canonical sesuai module config | not-started |  |
| Permission guard bekerja | User tanpa permission tidak melihat aksi/halaman | not-started |  |
| Loading state ada | Tidak terlihat layout kosong membingungkan | not-started |  |
| Error API tampil jelas | Pesan bisa dipahami user | not-started |  |
| Empty state ada | Empty bukan error, memberi konteks | not-started |  |
| Data angka rapi | Menggunakan format angka/mata uang dan `tabular-nums` | not-started |  |
| Date display konsisten | Format mudah dibaca dan input date valid | not-started |  |
| Responsive desktop/tablet/mobile | Tidak overlap, tidak horizontal overflow liar | not-started |  |
| Viewport pendek | Toolbar/bottom bar tidak menutup field/tabel | not-started |  |
| Browser refresh aman | State penting tetap benar atau kembali ter-load | not-started |  |
| Deep link detail/edit aman | Data load benar, breadcrumb benar | not-started |  |

---

## Checklist List Page

| Item | Expected | Status | Finding ID |
|---|---|---|---|
| Kolom utama sesuai kebutuhan bisnis | Nomor dokumen/nama, tanggal, pihak, status, amount/qty, action | not-started |  |
| Search bekerja | Keyword relevan menghasilkan data benar | not-started |  |
| Filter status bekerja | Draft/posted/void/paid/open sesuai modul | not-started |  |
| Filter tanggal/range bekerja | Parameter tidak tertukar dan reset berfungsi | not-started |  |
| Filter entity bekerja | Customer/vendor/product/warehouse/account tampil label benar | not-started |  |
| Pagination bekerja | Page size, next/previous, total data stabil | not-started |  |
| Sorting jika ada | Tidak merusak filter/pagination | not-started |  |
| Row click/detail bekerja | Membuka detail yang benar | not-started |  |
| Create action tampil sesuai permission | Tombol tidak muncul untuk user tanpa izin | not-started |  |
| Row action tampil sesuai permission/status | Edit/post/void/delete hanya saat valid | not-started |  |
| Bulk selection jika ada | Select all, selected count, bulk void/action benar | not-started |  |
| Status badge jelas | Warna/label status tidak ambigu | not-started |  |
| Empty state filter | Reset filter tersedia atau jelas | not-started |  |
| Error state API | Retry atau pesan tersedia | not-started |  |

---

## Checklist Form Input

| Item | Expected | Status | Finding ID |
|---|---|---|---|
| Mode create load benar | Form kosong/default sesuai bisnis | not-started |  |
| Mode edit/view load benar | Data existing tampil lengkap | not-started |  |
| Field wajib tervalidasi | Error muncul di field yang tepat | not-started |  |
| Validasi angka | Tidak menerima minus/decimal/zero jika tidak valid | not-started |  |
| Validasi tanggal | Tanggal lock/fiscal period tidak bisa dipakai jika dilarang | not-started |  |
| Select/search preload | Nilai existing tampil label benar, bukan ID mentah | not-started |  |
| Line items bisa tambah/hapus | Tidak merusak subtotal dan fokus input | not-started |  |
| Kalkulasi subtotal/tax/discount/total benar | Recalculate saat qty/price/tax berubah | not-started |  |
| Draft lokal jika ada | Unsaved draft tersimpan dan bisa dibersihkan | not-started |  |
| Submit create berhasil | Payload sesuai backend, redirect/toast benar | not-started |  |
| Submit update berhasil | Perubahan tersimpan dan reload benar | not-started |  |
| Error validasi backend tampil | Field errors dan global errors jelas | not-started |  |
| Post/approve/finalize action benar | Hanya tersedia pada status yang valid | not-started |  |
| Void/cancel action benar | Dialog konfirmasi, reason, status final benar | not-started |  |
| Dokumen posted read-only | Field terkunci, action terbatas | not-started |  |
| Navigasi keluar dengan perubahan | Draft/confirm behavior tidak kehilangan data diam-diam | not-started |  |
| Bottom action bar | Tidak menutup field, action tetap terlihat | not-started |  |

---

## Checklist Laporan

| Item | Expected | Status | Finding ID |
|---|---|---|---|
| Filter periode/as-of date bekerja | Parameter dikirim benar dan data berubah | not-started |  |
| Filter entity bekerja | Akun/customer/vendor/product/warehouse label benar | not-started |  |
| Default filter masuk akal | Tidak langsung kosong membingungkan | not-started |  |
| Totals benar | Subtotal dan grand total konsisten dengan row | not-started |  |
| Empty state benar | Tidak dianggap error saat tidak ada data | not-started |  |
| Error backend tampil jelas | Contract mismatch terlihat sebagai pesan yang bisa ditindak | not-started |  |
| Loading tidak menggeser layout berlebihan | Header/filter tetap stabil | not-started |  |
| Export/print hanya jika didukung | Tidak ada tombol fiktif | not-started |  |
| Responsif | Tabel laporan bisa dibaca di tablet/mobile | not-started |  |
| Angka negatif/zero jelas | Format konsisten, tidak salah warna/sign | not-started |  |

---

## Checklist Workflow Dokumen

| Item | Expected | Status | Finding ID |
|---|---|---|---|
| Draft -> posted | Status berubah, nomor final/jurnal/stok dibuat sesuai modul | not-started |  |
| Posted -> void | Reversal/journal/stock impact benar | not-started |  |
| Source document picker | Dokumen sumber tampil, searchable, tidak salah entity | not-started |  |
| Conversion flow | Quotation->SO, SO->DO/Invoice, PO->GR/Bill berjalan jika ada | not-started |  |
| Partial fulfillment | Qty sisa benar dan tidak bisa over-fulfill | not-started |  |
| Payment allocation | Tidak bisa overpay tanpa aturan jelas | not-started |  |
| Return/refund/credit | Balance invoice/bill dan stock update benar | not-started |  |
| Period lock | Dokumen tanggal terkunci tidak bisa diubah/post/void jika dilarang | not-started |  |
| Permission per action | Action sensitive tidak bocor ke user tanpa permission | not-started |  |

---

## Missing Module / Missing Feature Log

Catat semua modul, halaman, action, field, filter, atau laporan yang seharusnya ada tapi belum tersedia atau belum lengkap.

| ID | Modul | Missing Item | Bukti / Route | Dampak | Severity | Rekomendasi | Status |
|---|---|---|---|---|---|---|---|
| MM-001 |  |  |  |  |  |  | not-started |

Kategori missing item:

| Kategori | Contoh |
|---|---|
| Missing module | Modul payroll, POS, manufacturing, atau modul lain yang dibutuhkan bisnis tapi belum ada |
| Missing page | List ada tapi form/detail tidak ada, atau report index punya kartu tanpa route |
| Missing action | Tidak ada post/void/convert/export yang dibutuhkan workflow |
| Missing field | Field backend/business penting tidak tersedia di UI |
| Missing filter | Laporan/list tidak bisa difilter berdasarkan kebutuhan audit |
| Missing validation | UI membiarkan input yang harusnya ditolak |
| Missing permission | Action tampil tanpa guard atau permission terlalu luas |
| Missing state | Loading/error/empty/read-only tidak tersedia |

---

## Finding Log

Semua temuan audit manual masuk ke tabel ini.

| Finding ID | Severity | Modul | Route | Tipe | Ringkasan Temuan | Langkah Reproduksi | Expected | Actual | Bukti | Status | Owner | Fix Ref |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A13-001 | medium |  |  |  |  |  |  |  |  | open |  |  |

Status finding:

| Status | Arti |
|---|---|
| `open` | Baru dicatat, belum dikerjakan |
| `triaged` | Sudah divalidasi dan diprioritaskan |
| `in-progress` | Sedang diperbaiki |
| `fixed` | Sudah diperbaiki |
| `verified` | Fix sudah dicek ulang manual |
| `wont-fix` | Tidak dikerjakan, alasan dicatat |
| `duplicate` | Duplikat finding lain |

---

## Page Audit Detail Template

Duplikasi blok ini setiap kali ingin membuat catatan detail per halaman.

```text
Page Audit ID:
Tanggal:
Auditor:
Modul:
Route:
Tipe halaman:
Role:
Data uji:

Ringkasan:

Checklist penting:
- [ ] Route/menu benar
- [ ] Permission/action benar
- [ ] Loading/error/empty state benar
- [ ] Data tampil sesuai backend
- [ ] Filter/search/pagination bekerja
- [ ] Form validation / report totals benar
- [ ] Responsive desktop/tablet/mobile aman
- [ ] Tidak ada console error

Temuan:
-

Keputusan:
- Status: not-started / passed / issue-found / blocked / not-applicable
- Finding ID terkait:
```

---

## Laporan Ringkas Hasil Audit

Update bagian ini setelah sesi audit selesai.

| Metric | Jumlah |
|---|---:|
| Total halaman diaudit | 0 |
| Passed | 0 |
| Issue found | 0 |
| Blocked | 0 |
| Critical findings | 0 |
| High findings | 0 |
| Medium findings | 0 |
| Low findings | 0 |
| Missing module/feature | 0 |

Ringkasan naratif:

```text
Tanggal audit:
Scope:
Kesimpulan:
Risiko terbesar:
Area paling stabil:
Area perlu audit lanjutan:
Rekomendasi prioritas:
```

---

## Prioritas Perbaikan Setelah Audit

Gunakan urutan ini saat mengubah finding menjadi backlog implementasi.

| Prioritas | Kriteria |
|---|---|
| P0 | Critical, user tidak bisa menyelesaikan transaksi/laporan utama, atau data salah |
| P1 | High, workflow penting terganggu tetapi ada workaround |
| P2 | Medium, UX/validasi/filter/state perlu diperbaiki |
| P3 | Low, polish dan konsistensi visual/copy |

Backlog hasil audit:

| Prioritas | Finding ID | Judul | Modul | Rekomendasi Fix | Status |
|---|---|---|---|---|---|
| P0 |  |  |  |  | open |

---

## Dokumen Referensi Saat Audit

| Area Audit | Dokumen Referensi |
|---|---|
| API contract | `docs/audit_docs/audit-frontend-api-contract.md` |
| Workflow sales | `docs/audit_docs/audit-04-sales-workflow-audit.md` |
| Workflow purchase | `docs/audit_docs/audit-05-purchase-workflow-audit.md` |
| Workflow inventory | `docs/audit_docs/audit-06-inventory-workflow-audit.md` |
| Accounting/reporting | `docs/audit_docs/audit-07-accounting-and-reporting-audit.md` |
| Business rules | `docs/audit_docs/audit-08-business-rules-and-validation-map.md` |
| UX workflow audit sebelumnya | `docs/audit_docs/audit-12-frontend-ux-workflow-audit-16-06-26.md` |
| Form design | `docs/design_docs/design-D1-form-layout.md` |
| Table/list design | `docs/design_docs/design-C1-datatable.md` |
| Report spec | `docs/praproduction_docs/spec-16-reports-module.md` |
| Tablet/viewport rules | `docs/praproduction_docs/spec-23-tablet-first-layout-rules.md` |
