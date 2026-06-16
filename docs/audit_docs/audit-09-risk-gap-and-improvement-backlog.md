# Risk Gap and Improvement Backlog

Catatan: Audit ini tidak menjalankan test suite dan tidak memverifikasi runtime behavior melalui eksekusi test. Temuan berdasarkan pembacaan kode secara read-only.

## Summary Count

- Critical: 0
- High: 7
- Medium: 10
- Low: 5
- Enhancement: 5

## High

### H1 - System-generated journal tidak selalu lewat centralized validator

File: `app/Services/Sales/*`, `app/Services/Purchase/*`, `app/Services/CashBank/*`, `app/Services/Inventory/StockMovementJournalService.php`.

Masalah: Banyak service membuat `JournalEntry` dan `lines()->createMany()` langsung. Manual journal memakai `JournalValidationService`, tetapi system journal tidak selalu divalidasi balance/account/dimension secara generik.

Dampak: Bug line builder dapat membuat GL tidak balance atau memakai account invalid.

Rekomendasi: Tambahkan service helper `SystemJournalBuilder` atau validator post-create sebelum save/post. Jangan ubah struktur journal besar; mulai dari assertion balanced dan active account.

Migration: Tidak. Test: Ya. Kompleksitas: Medium.

Confidence: High.

### H2 - Foreign-like reference operasional banyak tanpa FK DB

File: `database/migrations/tenant/*sales*`, `*purchase*`, `*stock*`.

Masalah: Banyak `customer_id`, `vendor_id`, `product_id`, `warehouse_id`, source fields, user fields tidak punya FK eksplisit.

Dampak: Orphan reference bila ada import/manual DB write atau bug service.

Rekomendasi: Audit data existing, tambahkan FK bertahap untuk yang aman, dan minimal tambah index/validation service coverage.

Migration: Ya bertahap. Test: Ya. Kompleksitas: Large.

Confidence: High.

### H3 - Mixed stock adjustment dapat gagal karena duplicate source movement

File: `app/Services/Inventory/StockAdjustmentService.php`, `StockMovementService::assertSourceNotAlreadyMoved`.

Masalah: Adjustment dengan line increase dan decrease membuat dua movement source `stock_adjustment` id sama; duplicate guard menolak movement kedua.

Dampak: Adjustment campuran tidak bisa diposting atau transaksi rollback.

Rekomendasi: Izinkan source sama dengan movement type berbeda untuk adjustment/opname, atau gunakan `source_line_id`/batch id sebagai uniqueness scope.

Migration: Mungkin jika menambah unique index baru. Test: Ya. Kompleksitas: Medium.

Confidence: High.

### H4 - Mixed stock opname dapat gagal karena duplicate source movement

File: `app/Services/Inventory/StockOpnameService.php`, `StockMovementService`.

Masalah: Opname yang punya difference positif dan negatif membuat `opname_in` dan `opname_out` dengan source sama.

Dampak: Finalize opname campuran berpotensi gagal.

Rekomendasi: Sama seperti H3.

Migration: Mungkin. Test: Ya. Kompleksitas: Medium.

Confidence: High.

### H5 - Generic stock movement void/reversal journal perlu verifikasi

File: `StockMovementService::void`, `createReversal`, `StockMovementJournalService`, `TransactionVoidEffectService`.

Masalah: Source transaction void cascade meng-void generated journal, tetapi generic stock movement void membuat reversal movement dan journal baru. Perlu dipastikan original journal tidak tetap reportable ganda dalam semua path.

Dampak: Inventory GL bisa double atau tidak net-off.

Rekomendasi: Tambahkan test stock movement direct post+void, cek stock balance dan GL.

Migration: Tidak. Test: Ya. Kompleksitas: Medium.

Confidence: Medium.

### H6 - Direct Vendor Bill stock receipt butuh rekonsiliasi ketat

File: `VendorBillService`, `InventoryPurchaseIntegrationService`, `StockMovementJournalService`.

Masalah: Vendor bill direct stock dapat membuat `purchase_in`; stock movement journal mengembalikan null untuk source vendor_bill agar tidak double journal. Journal AP bill harus sudah mendebit inventory dengan benar.

Dampak: Potensi mismatch stock valuation vs GL inventory jika line/account resolver salah.

Rekomendasi: Tambah integration test direct bill stock, GR bill, non-stock expense, taxable.

Migration: Tidak. Test: Ya. Kompleksitas: Medium.

Confidence: High untuk desain, Medium untuk risiko runtime.

### H7 - Period lock bulanan belum menjadi blocker

File: `app/Services/Accounting/PeriodLockService.php`.

Masalah: `isPeriodClosed` ada, tetapi komentar menyatakan monthly accounting period status belum dipakai untuk blocking MVP.

Dampak: User dapat mengira period bulan closed sudah mengunci transaksi, padahal blocker efektif fiscal year closed/locked_until.

Rekomendasi: Jika business rule membutuhkan monthly period lock, integrasikan ke `isDateReadOnly`.

Migration: Tidak. Test: Ya. Kompleksitas: Small.

Confidence: High.

## Medium

### M1 - Config movement transfer tidak sinkron dengan validator

File: `config/inventory.php`, `StockMovementValidationService`.

Rekomendasi: Hapus transfer dari config jika belum didukung, atau implement transfer service lengkap.

Migration: Tidak. Test: Ya. Kompleksitas: Small/Medium.

### M2 - Mapping optional di config tetapi required runtime

File: `config/account_mappings.php`, Sales/Purchase/Inventory journal services.

Contoh: `purchase.inventory_interim`, `sales.return`, `purchase.return`, `inventory.adjustment_gain/loss`.

Rekomendasi: Tandai conditional required di UI/config atau buat preflight validation per workflow.

Migration: Tidak. Test: Ya. Kompleksitas: Small.

### M3 - Opening stock service khusus tidak ditemukan

File: `StockMovementService`, `StockMovementJournalService`, config.

Risiko: opening stock berulang untuk product+warehouse tidak tampak dibatasi di service khusus.

Rekomendasi: Jika flow opening stock dipakai, tambahkan guard once-per-product-warehouse atau rule eksplisit.

Migration: Mungkin. Test: Ya. Kompleksitas: Medium.

### M4 - Source type tidak sepenuhnya tersentralisasi

File: `config/source_links.php`, banyak service hardcode string.

Rekomendasi: Pakai enum/constant source type untuk mengurangi typo.

Migration: Tidak. Test: Ya. Kompleksitas: Medium.

### M5 - Stock movement duplicate source belum DB-level

File: `stock_movements` migration.

Rekomendasi: Tambah partial/functional uniqueness bila DB mendukung, atau service + lock transaction.

Migration: Ya. Test: Ya. Kompleksitas: Medium.

### M6 - Return paid bill diblokir tanpa vendor credit workflow

File: `PurchaseReturnService::createFromVendorBill`.

Rekomendasi: Dokumentasikan sebagai limitation atau desain vendor credit note.

Migration: Mungkin. Test: Ya. Kompleksitas: Large.

### M7 - Sales delivery-only return perlu test detail

File: `SalesReturnService`.

Rekomendasi: Tambah test return dari delivery order tanpa invoice, cek stock dan delivered/returned tracking.

Migration: Tidak. Test: Ya. Kompleksitas: Small.

### M8 - Invoice/bill status setelah kombinasi payment, deposit, return

File: `SalesInvoiceService`, `VendorBillService`, return/payment/deposit services.

Rekomendasi: Tambah matrix test status/balance.

Migration: Tidak. Test: Ya. Kompleksitas: Medium.

### M9 - Account mapping opening stock punya dua key mirip

File: `config/account_mappings.php`, `InventoryAccountMappingService`.

Rekomendasi: Tetapkan satu key canonical: `opening_balance.equity` atau `inventory.opening_stock_equity`.

Migration: Tidak. Test: Ya. Kompleksitas: Small.

### M10 - Reconciliation report berada pada dirty working tree

File: `app/Modules/Reports/Routes/api.php`, `app/Services/Reports/ReconciliationReportService.php`.

Rekomendasi: Pastikan file sudah masuk repo dan test controller/service.

Migration: Tidak. Test: Ya. Kompleksitas: Small.

## Low

### L1 - Tidak ditemukan policy model-level

Authorization route-level cukup jelas, tetapi policy model-level tidak ditemukan.

Rekomendasi: Tetap route-level jika sesuai desain; pertimbangkan policy untuk object-level ownership jika dibutuhkan.

### L2 - Soft delete tidak dipakai pada model utama

Risiko hapus data bergantung controller/service. Saat ini route lebih banyak deactivate/void daripada delete.

Rekomendasi: Dokumentasikan rule no-delete untuk dokumen posted.

### L3 - Request route map tidak diverifikasi dengan artisan route:list

Karena larangan command non-read-only yang bisa bootstrap runtime, route map dibuat dari file.

### L4 - Banyak status string bebas

Rekomendasi: enum/constant bertahap.

### L5 - Error message campuran Indonesia/English

Rekomendasi: Standarisasi message untuk API.

## Enhancement

### E1 - Preflight account mapping health check

Endpoint/service untuk mengecek semua mapping required dan conditional by enabled workflow.

### E2 - Transaction consistency dashboard

Dashboard mismatch stock movement vs GL, AR/AP subledger vs GL, GRNI aging.

### E3 - Document lifecycle matrix tests

Test parametrik per dokumen: draft edit, post once, void reason, period locked.

### E4 - Import validator

Jika ada import massal, wajib pakai BusinessReferenceValidator dan source duplicate validator.

### E5 - Centralized source document registry

Registry source_type/source_module/source lifecycle agar report dan cascade void tidak hardcode string.

